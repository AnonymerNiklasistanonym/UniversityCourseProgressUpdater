#!/usr/bin/env ts-node

import { promises as fs } from 'fs'
import * as path from 'path';

// Main method (async wrapper)
(async () => {
    try {
        const distDir = path.join(__dirname, 'dist')
        await fs.mkdir(distDir, { recursive: true })
        const fileContentLib = await fs.readFile(path.join(__dirname, 'updateProgressLib.js'))
        const fileContentMain = await fs.readFile(path.join(__dirname, 'updateProgress.js'))
        const updatedLibContent = fileContentLib
            .toString()
            .substring(0, fileContentLib.toString().indexOf('module.exports') - 1)
        const updatedMainContent = fileContentMain
            .toString()
            .substring(fileContentMain.toString().indexOf('// Main') - 1)
            .replace(/updateProgress\./g, '')
        const outputPath = path.join(distDir, 'updateProgress.js')
        await fs.writeFile(outputPath, updatedLibContent + updatedMainContent)
        await fs.chmod(outputPath, 0o755)
        const jsonSchema = path.join(__dirname, 'progress.schema.json')
        const jsonExample = path.join(__dirname, 'progress.json')
        const jsonSchemaDist = path.join(distDir, 'progress.schema.json')
        const jsonExampleDist = path.join(distDir, 'progress.json')
        await fs.copyFile(jsonSchema, jsonSchemaDist)
        await fs.copyFile(jsonExample, jsonExampleDist)
    } catch (error) {
        console.error(error)
        return process.exit(1)
    }
})()
