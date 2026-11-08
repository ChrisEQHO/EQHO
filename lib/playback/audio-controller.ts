/**
 * The single active audio controller. Wraps ONE media element, registers each
 * listener exactly once, and tags every ready/ended/error callback with the load
 * token it belongs to. Creating a new controller disposes the previous one, so
 * two tracks can never play at the same time.
 */

export interface AudioElementLike {
  src: string;
  currentTime: number;
  paused: boolean;
  play(): Promise<void> | void;
  pause(): void;
  load?(): void;
  removeAttribute?(name: string): void;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export interface AudioControllerHandlers {
  onReady(token: number): void;
  onEnded(token: number): void;
  onError(token: number, message: string): void;
}

export interface AudioController {
  load(src: string, token: number): void;
  play(): Promise<boolean>;
  pause(): void;
  stop(): void;
  dispose(): void;
  readonly disposed: boolean;
}

let activeController: AudioController | null = null;

export function getActiveAudioController(): AudioController | null {
  return activeController;
}

export function createAudioController(
  element: AudioElementLike,
  handlers: AudioControllerHandlers,
): AudioController {
  activeController?.dispose();

  let token = -1;
  let endedToken = -1;
  let disposed = false;

  const onCanPlay = () => {
    if (!disposed && token >= 0) handlers.onReady(token);
  };
  const onEnded = () => {
    // One natural end per load: WebViews can fire `ended` twice.
    if (disposed || token < 0 || endedToken === token) return;
    endedToken = token;
    handlers.onEnded(token);
  };
  const onError = () => {
    if (!disposed && token >= 0) handlers.onError(token, "The track could not be played.");
  };

  element.addEventListener("canplay", onCanPlay);
  element.addEventListener("ended", onEnded);
  element.addEventListener("error", onError);

  const controller: AudioController = {
    get disposed() {
      return disposed;
    },
    load(src, nextToken) {
      if (disposed) return;
      element.pause();
      token = nextToken;
      element.src = src;
      element.currentTime = 0;
      element.load?.();
    },
    async play() {
      if (disposed || token < 0) return false;
      const playToken = token;
      try {
        await element.play();
        return true;
      } catch (err) {
        if (!disposed && playToken === token) {
          handlers.onError(playToken, err instanceof Error ? err.message : "Playback was blocked.");
        }
        return false;
      }
    },
    pause() {
      if (!disposed) element.pause();
    },
    stop() {
      if (disposed) return;
      element.pause();
      token = -1;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      element.pause();
      element.removeEventListener("canplay", onCanPlay);
      element.removeEventListener("ended", onEnded);
      element.removeEventListener("error", onError);
      element.removeAttribute?.("src");
      element.load?.();
      if (activeController === controller) activeController = null;
    },
  };

  activeController = controller;
  return controller;
}
