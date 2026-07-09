#!/usr/bin/env node

/**
 * Restore files after mobile static export build.
 * Run after: NEXT_PUBLIC_BUILD_TARGET=mobile next build
 *
 * Handles two kinds of backups created by prepare-mobile-build.js:
 *  1. Moved files/dirs (server-only routes) stored directly under the backup dir.
 *  2. Stubbed Server Action files stored under `${backupDir}/__stubbed__/...`,
 *     which must overwrite the stub that was copied into place.
 */

const fs = require('fs')
const path = require('path')

const backupDir = '.mobile-build-backup'
const stubbedDirName = '__stubbed__'

if (!fs.existsSync(backupDir)) {
  console.log('No backup found. Nothing to restore.')
  process.exit(0)
}

const stubbedRoot = path.join(backupDir, stubbedDirName)

// Recursively restore moved files from backup, skipping the __stubbed__ subtree.
function restoreMovedFiles(dir) {
  const items = fs.readdirSync(dir)

  items.forEach(item => {
    const backupPath = path.join(dir, item)

    // Skip the stubbed-originals subtree; handled separately below.
    if (path.resolve(backupPath) === path.resolve(stubbedRoot)) return

    const relativePath = path.relative(backupDir, backupPath)
    const destPath = path.join(process.cwd(), relativePath)
    const stat = fs.statSync(backupPath)

    if (stat.isDirectory()) {
      restoreMovedFiles(backupPath)
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true })
      fs.renameSync(backupPath, destPath)
      console.log(`Restored: ${relativePath}`)
    }
  })
}

// Restore stubbed Server Action originals, overwriting the stubs in place.
function restoreStubbedFiles(dir) {
  if (!fs.existsSync(dir)) return
  const items = fs.readdirSync(dir)

  items.forEach(item => {
    const backupPath = path.join(dir, item)
    const relativePath = path.relative(stubbedRoot, backupPath)
    const destPath = path.join(process.cwd(), relativePath)
    const stat = fs.statSync(backupPath)

    if (stat.isDirectory()) {
      restoreStubbedFiles(backupPath)
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true })
      // Overwrite the stub that prepare copied into place.
      fs.copyFileSync(backupPath, destPath)
      fs.rmSync(backupPath)
      console.log(`Restored (unstubbed): ${relativePath}`)
    }
  })
}

restoreMovedFiles(backupDir)
restoreStubbedFiles(stubbedRoot)

// Remove backup directory
fs.rmSync(backupDir, { recursive: true })
console.log('\nWeb build files restored.')
