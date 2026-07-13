// EQHO Player desktop wrapper (Tauri v2).
//
// This is a thin, secure native shell that loads the LIVE production web app.
// It deliberately does NOT bundle the Next.js server routes or the mobile static
// export, because Supabase auth, API routes, Cloudflare R2, and Stripe all depend
// on the running server at https://www.eqho-player.com.
//
// Responsibilities:
//   * Load the live site in the main window (persistent cookies/localStorage keep
//     the user signed in across restarts — WKWebView on macOS persists these by
//     default in the app's data container).
//   * Restrict TOP-LEVEL navigation to trusted EQHO production hosts. Anything
//     else (external legal pages, unknown links) opens in the user's browser.
//     Sub-resource requests (Supabase API, R2, Stripe JS/XHR) are unaffected and
//     always work.
//   * Show a branded offline screen with a Retry button if the site is
//     unreachable, instead of a blank window.
//   * Emit development diagnostics (enabled in debug builds or via EQHO_DEBUG).

use std::net::ToSocketAddrs;
use std::time::Duration;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
use url::Url;

const PRODUCTION_URL: &str = "https://www.eqho-player.com";
const PRODUCTION_HOST: &str = "www.eqho-player.com";

/// Hosts allowed to load as TOP-LEVEL navigations inside the app window.
/// This only governs full-page navigations so the window cannot be steered to an
/// untrusted site. It does NOT affect fetch/XHR sub-resource requests (Supabase
/// REST/Realtime, R2 downloads/uploads, Stripe.js), which always work.
fn is_trusted_nav_host(host: &str) -> bool {
    let h = host.to_ascii_lowercase();
    // EQHO production
    h == "eqho-player.com"
        || h.ends_with(".eqho-player.com")
        // Supabase authentication (email/password + any auth redirect/callback)
        || h.ends_with(".supabase.co")
        || h.ends_with(".supabase.in")
        // Stripe subscription checkout + billing portal (full-page redirects)
        || h == "stripe.com"
        || h.ends_with(".stripe.com")
        // Cloudflare R2 (playlist upload/download endpoints)
        || h.ends_with(".r2.cloudflarestorage.com")
        || h.ends_with(".r2.dev")
}

fn diagnostics_enabled() -> bool {
    cfg!(debug_assertions) || std::env::var("EQHO_DEBUG").is_ok()
}

fn log_diag(kind: &str, msg: &str) {
    if diagnostics_enabled() {
        println!("[EQHO][{kind}] {msg}");
    }
}

/// Open a URL in the user's normal browser (used for untrusted / external links).
fn open_external(url: &str) {
    log_diag("open-external", url);
    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("open").arg(url).spawn();
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("cmd")
        .args(["/C", "start", "", url])
        .spawn();
    #[cfg(target_os = "linux")]
    let _ = std::process::Command::new("xdg-open").arg(url).spawn();
}

/// Lightweight connectivity check: DNS-resolve the production host and open a TCP
/// connection to :443 with a short timeout. Pure std (no extra crates) and robust
/// enough to decide whether to load the live site or the offline screen.
fn check_connectivity() -> bool {
    let addrs = match (PRODUCTION_HOST, 443u16).to_socket_addrs() {
        Ok(a) => a,
        Err(_) => return false,
    };
    for addr in addrs {
        if std::net::TcpStream::connect_timeout(&addr, Duration::from_secs(5)).is_ok() {
            return true;
        }
    }
    false
}

/// Called by the offline screen's Retry button. Re-checks connectivity and, if
/// online, navigates the main window back to the live site. Returns whether we
/// are online so the offline page can update its UI.
#[tauri::command]
fn retry_connection(app: tauri::AppHandle) -> bool {
    let online = check_connectivity();
    log_diag("retry", &format!("online={online}"));
    if online {
        if let Some(win) = app.get_webview_window("main") {
            if let Ok(u) = Url::parse(PRODUCTION_URL) {
                let _ = win.navigate(u);
            }
        }
    }
    online
}

/// Exposed so the offline screen can decide whether to render the dev diagnostics.
#[tauri::command]
fn diagnostics_state() -> bool {
    diagnostics_enabled()
}

// Minimal dev-only overlay injected into the live page: shows the current URL and
// surfaces JavaScript errors. Only injected when diagnostics are enabled, so it is
// absent from production release builds.
const DIAG_OVERLAY_JS: &str = r#"
(function () {
  if (window.__eqhoDiag) return;
  window.__eqhoDiag = true;
  var box = document.createElement('div');
  box.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:2147483647;max-width:70vw;'
    + 'font:11px/1.4 monospace;color:#a3e635;background:rgba(0,0,0,0.8);border:1px solid rgba(163,230,53,0.4);'
    + 'border-radius:8px;padding:6px 8px;pointer-events:none;white-space:pre-wrap;';
  function render(extra){ box.textContent = 'EQHO DIAG\nurl: ' + location.href + (extra ? '\n' + extra : ''); }
  render('');
  window.addEventListener('error', function (e) { render('js-error: ' + (e.message || e.type)); });
  window.addEventListener('unhandledrejection', function (e) { render('promise-rejection'); });
  (document.body || document.documentElement).appendChild(box);
})();
"#;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![retry_connection, diagnostics_state])
        .setup(|app| {
            let online = check_connectivity();
            log_diag("startup", &format!("connectivity online={online}"));

            // Load the live site when online; otherwise show the bundled offline
            // screen (never a blank window).
            let initial = if online {
                WebviewUrl::External(Url::parse(PRODUCTION_URL).expect("valid production url"))
            } else {
                WebviewUrl::App("offline.html".into())
            };

            WebviewWindowBuilder::new(app, "main", initial)
                .title("EQHO Player")
                .inner_size(1280.0, 820.0)
                .min_inner_size(900.0, 600.0)
                .resizable(true)
                .center()
                .on_navigation(|url| {
                    // Local app pages (the offline screen) are always allowed.
                    let scheme = url.scheme();
                    if scheme == "tauri" || scheme == "asset" || scheme == "data" {
                        return true;
                    }
                    let host = url.host_str().unwrap_or("");
                    if is_trusted_nav_host(host) {
                        log_diag("nav-allow", url.as_str());
                        if url.path().contains("/auth/callback") || host.ends_with(".supabase.co") {
                            log_diag("auth-redirect", url.as_str());
                        }
                        true
                    } else {
                        // Untrusted top-level navigation -> open in the user's
                        // normal browser and cancel the in-app navigation.
                        open_external(url.as_str());
                        false
                    }
                })
                .on_page_load(|webview, payload| {
                    let url = payload.url().to_string();
                    match payload.event() {
                        tauri::webview::PageLoadEvent::Started => log_diag("load-start", &url),
                        tauri::webview::PageLoadEvent::Finished => {
                            log_diag("load-finish", &url);
                            if diagnostics_enabled() {
                                let _ = webview.eval(DIAG_OVERLAY_JS);
                            }
                        }
                    }
                })
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running EQHO Player");
}
