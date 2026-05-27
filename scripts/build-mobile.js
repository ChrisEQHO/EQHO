#!/usr/bin/env node
/**
 * Mobile build script for Capacitor static export
 * This script temporarily disables middleware (which is incompatible with static export)
 * then runs the Next.js build, and restores the middleware afterwards.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const middlewarePath = path.join(__dirname, '..', 'middleware.ts');
const middlewareBackupPath = path.join(__dirname, '..', 'middleware.ts.bak');

function backup() {
  if (fs.existsSync(middlewarePath)) {
    console.log('Backing up middleware.ts...');
    fs.renameSync(middlewarePath, middlewareBackupPath);
  }
}

function restore() {
  if (fs.existsSync(middlewareBackupPath)) {
    console.log('Restoring middleware.ts...');
    fs.renameSync(middlewareBackupPath, middlewarePath);
  }
}

async function main() {
  try {
    // Backup middleware
    backup();

    // Run build with mobile target
    console.log('Building for mobile (static export)...');
    execSync('NEXT_PUBLIC_BUILD_TARGET=mobile npm run build', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });

    console.log('Mobile build completed successfully!');
    console.log('Output directory: out/');
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  } finally {
    // Always restore middleware
    restore();
  }
}

main();
