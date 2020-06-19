#!/usr/bin/env node

const fs = require('fs').promises
const path = require('path');

// Main method (async wrapper)
(async () => {
    try {
        await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true })
        const fileContentLib = await fs.readFile(path.join(__dirname, 'updateProgressLib.js'))
        const fileContentMain = await fs.readFile(path.join(__dirname, 'updateProgress.js'))
        const updatedLibContent = fileContentLib
            .toString()
            .substring(0, fileContentLib.toString().indexOf('module.exports') - 1)
        const updatedMainContent = fileContentMain
            .toString()
            .substring(fileContentMain.toString().indexOf('// Main') - 1)
            .replace(/updateProgress\./g, '')
        const outputPath = path.join(__dirname, 'dist', 'updateProgress.js')
        await fs.writeFile(outputPath, updatedLibContent + updatedMainContent)
        await fs.chmod(outputPath, 0o755)
    } catch (error) {
        console.error(error)
        return process.exit(1)
    }
})()
