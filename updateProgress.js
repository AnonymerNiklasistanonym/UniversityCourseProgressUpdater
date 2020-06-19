#!/usr/bin/env node

// Source: https://github.com/AnonymerNiklasistanonym/UniversityCourseProgressUpdater

const updateProgress = require('./updateProgressLib');

// Main method (async wrapper)
(async () => {
    try {
        const cliArgs = updateProgress.parseCliArgs(process.argv.slice(2))
        const progressJsonPath = cliArgs.customProgressJsonFilePath ? cliArgs.customProgressJsonFilePath : updateProgress.defaultProgressPath
        const readmePath = cliArgs.customReadmeFilePath ? cliArgs.customReadmeFilePath : updateProgress.defaultReadmePath

        const progressJsonData = await updateProgress.getProgressJsonData(progressJsonPath)
        if (progressJsonData.version > updateProgress.versionNumberConfig) {
            console.warn(`The progress JSON file references a version later than this program supports (${progressJsonData.version}).`)
            console.warn('Try to update this program for the full support of all features and configurations.')
        }
        const newProgressContent = updateProgress.renderNewProgressContent(progressJsonData)
        await updateProgress.updateReadmeContent(readmePath, updateProgress.readmeProgressIndicators(progressJsonData.progressName), newProgressContent)
    } catch (error) {
        console.error(error)
        updateProgress.help()
        return process.exit(1)
    }
})()
