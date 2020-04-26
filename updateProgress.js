#!/usr/bin/env node

// Source: https://github.com/AnonymerNiklasistanonym/UniversityCourseProgressUpdater

const fs = require('fs').promises
const path = require('path')

const defaultReadmePath = path.join(__dirname, '..', 'README.md')

const defaultProgressPath = path.join(__dirname, 'progress.json')
const progressSchemaPath = path.join(__dirname, 'progress.schema.json')

/** @param {string} id Id of progress begin/end */
const readmeProgressIndicators = (id) => ({
    begin: `[//]: # (Progress ${id} begin)`,
    end: `[//]: # (Progress ${id} end)`
})

const cliArgIds = {
    customReadme: "CUSTOM_README=",
    customProgressJson: "CUSTOM_PROGRESS_JSON=",
}

const readmeMarkdownEmojis = {
  greenCheck: ':heavy_check_mark:',
  redCross: ':x:',
  yellowWarning: ':warning:'
}

const versionNumber = 2

const help = () =>{
    console.log("updateProgress [OPTIONS]\n")
    console.log("Visualizes the data of a JSON schema conform JSON file in the README file")
    console.log(`- Default README.md:     '${path.relative(process.cwd(), defaultReadmePath)}'`)
    console.log(`- Default JSON progress: '${path.relative(process.cwd(), defaultProgressPath)}'`)
    console.log(`- JSON schema:           '${path.relative(process.cwd(), progressSchemaPath)}'\n`)
    console.log("Options:")
    console.log(`\t${cliArgIds.customReadme}         File path to README.md file`)
    console.log(`\t${cliArgIds.customProgressJson}  File path to JSON schema conform JSON progress file`)
}

const version = () => { console.log(`${versionNumber}`) }

/**
 * @param {string[]} tableRowValues Table row data
 * @returns Table row data string
 */
const createMdTableRow = tableRowValues => '| ' + tableRowValues.join(' | ') + ' |'

/** @param {number} number Floating point number */
const renderFloatingPointNumber = (number) => number.toFixed(2).replace(/\.00$/, '')

/** @param {number} percentage Percentage */
const renderPercentage = (percentage) => renderFloatingPointNumber(percentage * 100)

/** @returns {import('./updateProgressTypes').CliArgs} */
const parseCliArgs = () => {
    const args = process.argv.slice(2);
    /** @type {import('./updateProgressTypes').CliArgs} */
    const cliArgs = {}
    for (const arg of args) {
        if (arg.startsWith(cliArgIds.customReadme)) {
            cliArgs.customReadmeFilePath = arg.substring(cliArgIds.customReadme.length)
        } else if (arg.startsWith(cliArgIds.customProgressJson)) {
            cliArgs.customProgressJsonFilePath = arg.substring(cliArgIds.customProgressJson.length)
        } else if (arg === "--help") {
            help()
            process.exit(0)
        }  else if (arg === "--version") {
            version()
            process.exit(0)
        } else {
            throw Error(`Unsupported argument '${arg}'!`)
        }
    }
    return cliArgs
}

/**
 * @param {string} filePath The file path of the progress.json file
 * @returns {Promise<import('./progress').JSONSchemaOfProgressData>}
 */
const getProgressJsonData = async (filePath) => {
    const content = await fs.readFile(filePath)
    return JSON.parse(content.toString())
}

/**
 * @param {import('./progress').JSONSchemaOfProgressData} progressJsonData The progress.json data
 */
const renderNewProgressContent = async (progressJsonData) => {
    if (progressJsonData.version < 2) {
        throw Error("Please update the progress.json file, only version 2 or higher are supported")
    }
    const tableState = []
    /** @type {import('./updateProgressTypes').CheckerInfo} */
    const checkerInfo = {}
    if (progressJsonData.options) {
        const tableStateHeader = []
        const tableStateBody = []
        if (progressJsonData.options.minimumPointsPercentageAllSubmissions !== undefined
            || progressJsonData.options.minimumPointsAllSubmissions !== undefined) {
            // Add checker for minimum points
            tableStateHeader.push("Necessary points")
            tableStateHeader.push("Current points")
            const allPoints = progressJsonData.exercises.reduce((previousValue, currentValue) =>
                previousValue + (currentValue.submission ? currentValue.submission.points : 0), 0)
            const achievedPoints = progressJsonData.exercises.reduce((previousValue, currentValue) =>
                previousValue + (currentValue.submission && currentValue.submission.achievedPoints ? currentValue.submission.achievedPoints : 0), 0)
            const achievedPointsPercentage = achievedPoints > 0 ? achievedPoints / allPoints : 0
            let necessaryPoints = -1
            let necessaryPointsPercentageFromAllPoints = -1
            if (progressJsonData.options.minimumPointsPercentageAllSubmissions !== undefined) {
                necessaryPointsPercentageFromAllPoints = progressJsonData.options.minimumPointsPercentageAllSubmissions
                necessaryPoints = allPoints * necessaryPointsPercentageFromAllPoints
            } else {
                necessaryPoints = progressJsonData.options.minimumPointsAllSubmissions
                necessaryPointsPercentageFromAllPoints = necessaryPoints / allPoints
            }
            checkerInfo.minimumPointsAllSubmissions = {
                achievedCount: achievedPoints,
                count: necessaryPoints,
                percentage: necessaryPointsPercentageFromAllPoints
            }
            const emojiIndicator = achievedPointsPercentage >= necessaryPointsPercentageFromAllPoints
                ? ` ${readmeMarkdownEmojis.greenCheck}` : ` ${readmeMarkdownEmojis.redCross}`

            if (tableStateBody.length === 0) { tableStateBody.push([]) }
            tableStateBody[0].push(`${renderFloatingPointNumber(necessaryPoints)}/${allPoints} (${renderPercentage(necessaryPointsPercentageFromAllPoints)}%)`)
            tableStateBody[0].push(`${renderFloatingPointNumber(achievedPoints)}/${allPoints} (${renderPercentage(achievedPointsPercentage)}%)${emojiIndicator}`)
        }
        if (progressJsonData.options.minimumSubmissionsPercentage !== undefined
            || progressJsonData.options.minimumSubmissions !== undefined) {
            // Add checker for minimum submissions
            tableStateHeader.push("Necessary submissions")
            tableStateHeader.push("Current submissions")
            const allSubmissions = progressJsonData.exercises.length
            const submittedSubmissions = progressJsonData.exercises.reduce((previousValue, currentValue) =>
                previousValue + ((
                    currentValue.submission
                    && currentValue.submission.achievedPoints !== undefined
                    && currentValue.submission.achievedPoints > 0
                ) ? 1 : 0), 0)
            const submittedSubmissionsPercentage = submittedSubmissions > 0 ? submittedSubmissions / allSubmissions : 0
            let necessarySubmissions = -1
            let necessarySubmissionsPercentage = -1
            if (progressJsonData.options.minimumSubmissionsPercentage !== undefined) {
                necessarySubmissionsPercentage = progressJsonData.options.minimumSubmissionsPercentage
                necessarySubmissions = allSubmissions * necessarySubmissionsPercentage
            } else {
                necessarySubmissions = progressJsonData.options.minimumSubmissions
                necessarySubmissionsPercentage = necessarySubmissions / allSubmissions
            }
            checkerInfo.minimumSubmissions = {
                achievedCount: submittedSubmissions,
                count: necessarySubmissions,
                percentage: necessarySubmissionsPercentage
            }
            const emojiIndicator = submittedSubmissions >= necessarySubmissions
                ? ` ${readmeMarkdownEmojis.greenCheck}` : ` ${readmeMarkdownEmojis.redCross}`

            if (tableStateBody.length === 0) { tableStateBody.push([]) }
            tableStateBody[0].push(`${renderFloatingPointNumber(necessarySubmissions)}/${allSubmissions} (${renderPercentage(necessarySubmissionsPercentage)}%)`)
            tableStateBody[0].push(`${renderFloatingPointNumber(submittedSubmissions)}/${allSubmissions} (${renderPercentage(submittedSubmissionsPercentage)}%)${emojiIndicator}`)
        }
        if (tableStateHeader.length > 0) {
            tableState.push(...[tableStateHeader, tableStateHeader.map(() => "---")].map(createMdTableRow))
            tableState.push(...tableStateBody.map(createMdTableRow))
            tableState.push("")
        }
    }

    const tableProgressHeader = ["Exercise" , "Points"]
    const tableProgressBody = progressJsonData.exercises.map(exercise => {
        const id = exercise.directory ? `[${exercise.number}](${exercise.directory})` : `${exercise.number}`
        let points = ""
        if (exercise.submission) {
            if (exercise.submission.achievedPoints !== undefined) {
                const achievedPercentage = exercise.submission.achievedPoints / exercise.submission.points
                points = `${exercise.submission.achievedPoints}/${exercise.submission.points} (${renderPercentage(achievedPercentage)}%)`
            } else {
                points = `${exercise.submission.points}`
                // Predictions if checkers are selected
                if (checkerInfo.minimumPointsAllSubmissions !== undefined && (
                    progressJsonData.options.minimumPointsPercentageAllSubmissions !== undefined
                    || progressJsonData.options.minimumPointsAllSubmissions !== undefined
                )) {
                    const currentlyAchievedPoints = progressJsonData.exercises.reduce((previousValue, currentValue) =>
                    previousValue + (
                        (currentValue.number <= exercise.number && currentValue.submission && currentValue.submission.achievedPoints)
                        ? currentValue.submission.achievedPoints : 0
                    ), 0)
                    const currentSubmissionCount = progressJsonData.exercises.reduce((previousValue, currentValue) =>
                    previousValue + (currentValue.number <= exercise.number && currentValue.submission && currentValue.submission.achievedPoints > 0 ? 1 : 0), 0)
                    const missingPoints = checkerInfo.minimumPointsAllSubmissions.count - currentlyAchievedPoints
                    if (missingPoints > 0) {
                        const upcomingExercises = progressJsonData.exercises.length - currentSubmissionCount
                        const missingPointsPerUpcomingExercise = missingPoints / upcomingExercises
                        points += ` (*at least ${Math.ceil(missingPointsPerUpcomingExercise)} are necessary*)`
                    }
                }
            }
        }
        const columns = [ id, points ]
        return columns
    })

    return [
        ...tableState,
        ...[tableProgressHeader, tableProgressHeader.map(() => "---")].map(createMdTableRow), ...tableProgressBody.map(createMdTableRow)
    ].join('\n')
}

/**
 * @param {string} filePath The file path of the README.md
 * @param {import('./updateProgressTypes').ReadmeProgressIndicators} progressIndicators The progress begin and start indicators
 * @param {string} newProgressContent The new progress string that should be displayed in the README.md file
 * @returns {Promise<void>}
 */
const updateReadmeContent = async (filePath, progressIndicators, newProgressContent) => {
    const readmeContent = await fs.readFile(filePath)
    const readmeContentSplitAtIndicatorBegin = readmeContent.toString().split(progressIndicators.begin)
    if (readmeContentSplitAtIndicatorBegin.length !== 2) {
        throw Error(`${filePath} content split at '${progressIndicators.begin}' didn't match or more than once`)
    }
    const readmeBeforeProgress = readmeContentSplitAtIndicatorBegin[0]
    const readmeContentSplitAtIndicatorEnd = readmeContentSplitAtIndicatorBegin[1].split(progressIndicators.end)
    if (readmeContentSplitAtIndicatorEnd.length !== 2) {
        throw Error(`${filePath} content split at '${progressIndicators.end}' didn't match or more than once`)
    }
    const readmeAfterProgress = readmeContentSplitAtIndicatorEnd[1]
    const newReadmeContent = readmeBeforeProgress + progressIndicators.begin + '\n\n'
        + newProgressContent + '\n\n' + progressIndicators.end + readmeAfterProgress
    await fs.writeFile(filePath, newReadmeContent)
}

// Main method (async wrapper)
(async () => {
    try {
        const cliArgs = parseCliArgs()
        const progressJsonPath = cliArgs.customProgressJsonFilePath ? cliArgs.customProgressJsonFilePath : defaultProgressPath
        const readmePath = cliArgs.customReadmeFilePath ? cliArgs.customReadmeFilePath : defaultReadmePath

        const progressJsonData = await getProgressJsonData(progressJsonPath)
        const newProgressContent = await renderNewProgressContent(progressJsonData)
        await updateReadmeContent(readmePath, readmeProgressIndicators(progressJsonData.progressName), newProgressContent)
    } catch (error) {
        console.error(error)
        help()
        return process.exit(1)
    }
})()
