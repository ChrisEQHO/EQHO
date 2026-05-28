#!/usr/bin/env node

/**
 * Prepare the app for Capacitor mobile static export.
 * Temporarily moves dynamic routes that can't be statically exported.
 * Run before: NEXT_PUBLIC_BUILD_TARGET=mobile next build
 * Run after:  node scripts/restore-web-build.js
 */

const fs = require('fs')
const path = require('path')

const filesToMove = [
  'app/icon.tsx',
  'app/apple-icon.tsx',
  'app/auth/callback/route.ts',
  'app/auth/error/page.tsx',
]

const backupDir = '.mobile-build-backup'

// Create backup directory
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true })
}

// Move files to backup
filesToMove.forEach(file => {
  const src = path.join(process.cwd(), file)
  const dest = path.join(process.cwd(), backupDir, file)
  
  if (fs.existsSync(src)) {
    // Create destination directory
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    // Move file
    fs.renameSync(src, dest)
    console.log(`Moved: ${file} -> ${backupDir}/${file}`)
  }
})

// Remove empty auth directory if it exists
const authDir = path.join(process.cwd(), 'app/auth')
if (fs.existsSync(authDir)) {
  try {
    fs.rmSync(authDir, { recursive: true })
    console.log('Removed: app/auth directory')
  } catch (e) {
    // Ignore errors
  }
}

console.log('\nMobile build preparation complete.')
console.log('Run: NEXT_PUBLIC_BUILD_TARGET=mobile pnpm build')
console.log('Then: node scripts/restore-web-build.js')
