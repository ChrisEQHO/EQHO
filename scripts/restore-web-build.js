#!/usr/bin/env node

/**
 * Restore files after mobile static export build.
 * Run after: NEXT_PUBLIC_BUILD_TARGET=mobile next build
 */

const fs = require('fs')
const path = require('path')

const backupDir = '.mobile-build-backup'

if (!fs.existsSync(backupDir)) {
  console.log('No backup found. Nothing to restore.')
  process.exit(0)
}

// Recursively restore files from backup
function restoreFiles(dir) {
  const items = fs.readdirSync(dir)
  
  items.forEach(item => {
    const backupPath = path.join(dir, item)
    const relativePath = path.relative(backupDir, backupPath)
    const destPath = path.join(process.cwd(), relativePath)
    
    const stat = fs.statSync(backupPath)
    
    if (stat.isDirectory()) {
      restoreFiles(backupPath)
    } else {
      // Create destination directory
      fs.mkdirSync(path.dirname(destPath), { recursive: true })
      // Move file back
      fs.renameSync(backupPath, destPath)
      console.log(`Restored: ${relativePath}`)
    }
  })
}

restoreFiles(backupDir)

// Remove backup directory
fs.rmSync(backupDir, { recursive: true })
console.log('\nWeb build files restored.')
