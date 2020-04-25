#!/usr/bin/env node

const fs = require('fs').promises
const path = require('path')

const readmePath = path.join(__dirname, '..', 'README.md')

const defaultProgressPath = path.join(__dirname, 'progress.json')
const progressSchemaPath = path.join(__dirname, 'progress.schema.json')

/** @param {string} id Id of progress begin/end */
const readmeProgressIndicators = (id) => ({
    begin: `[//]: # (Progress ${id} begin)`,
    end: `[//]: # (Progress ${id} end)`
})

const readmeMarkdownEmojis = {
  greenCheck: ':heavy_check_mark:',
  redCross: ':x:',
  yellowWarning: ':warning:'
}

/**
 * @param {string} filePath The file path of the README.md
 * @param {import('./update_progress_types').ReadmeProgressIndicators} progressIndicators The progress begin and start indicators
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
    const newReadmeContent = [
        readmeBeforeProgress + progressIndicators.begin + '\n',
        newProgressContent,
        '\n' + progressIndicators.end + readmeAfterProgress
    ]
    await fs.writeFile(filePath, newReadmeContent.join('\n'))
}

/**
 * @param {string} filePath The file path of the progress.json file
 * @returns {Promise<import('./update_progress_types').ProgressJson>}
 */
const getProgressJsonData = async (filePath) => {
    const content = await fs.readFile(filePath)
    return JSON.parse(content.toString())
}

/**
 * @param {string[]} tableRowValues Table row data
 * @returns {string} Table row data string
 */
const createMdTableRow = tableRowValues => '| ' + tableRowValues.join(' | ') + ' |'

/**
 * @param {number} number Floating point number
 * @returns {string} Visual representation of floating point number
 */
const renderFloatingPointNumber = (number) => number.toFixed(2).replace(/\.00$/, '')

/**
 * @param {number} percentage Percentage
 * @returns {string} Visual representation of percentage
 */
const renderPercentage = (percentage) => renderFloatingPointNumber(percentage * 100)

/**
 * @param {import('./update_progress_types').ProgressJson} progressJsonData The progress.json data
 * @param {string} [exerciseName] The name of the exercises that are visualized
 */
const renderNewProgressContent = async (progressJsonData, exerciseName) => {
    const tableColumns = [exerciseName !== undefined ? `Exercise (${exerciseName})` : 'Exercise' , "Points"]
    const tableProgressHeader = [
        createMdTableRow(tableColumns),
        createMdTableRow(tableColumns.map(a => " --- "))
    ]
    const tableProgressBody = progressJsonData.exercises.map(exercise => {
        const id = exercise.directory ? `[${exercise.number}](${exercise.directory})` : `${exercise.number}`
        let points = ""
        if (exercise.submission) {
            if (exercise.submission.achievedPoints !== undefined) {
                const achievedPercentage = exercise.submission.achievedPoints / exercise.submission.points * 100.0
                points = `${exercise.submission.achievedPoints}/${exercise.submission.points} (${achievedPercentage.toFixed(2).replace(/\.00$/, '')}%)`
            } else {
                points = `${exercise.submission.points}`
            }
        }
        const columns = [ id, points ]
        return createMdTableRow(columns)
    })

    const tableState = []
    if (progressJsonData.options) {
        const tableStateColumnsHeader = []
        const tableStateColumnsBody = []
        if (progressJsonData.options.minimumPointsPercentageAllSubmissions !== undefined) {
            tableStateColumnsHeader.push("Necessary points")
            tableStateColumnsHeader.push("Current points")
            const allPoints = progressJsonData.exercises.reduce((previousValue, currentValue) => {
                let maxPoints = 0
                if (currentValue.submission) {
                    maxPoints = currentValue.submission.points
                }
                return previousValue + maxPoints
            }, 0)
            const allAchievedPoints = progressJsonData.exercises.reduce((previousValue, currentValue) => {
                let achievedPoints = 0
                if (currentValue.submission && currentValue.submission.achievedPoints !== undefined) {
                    achievedPoints = currentValue.submission.achievedPoints
                }
                return previousValue + achievedPoints
            }, 0)
            const necessaryPoints = allPoints * (progressJsonData.options.minimumPointsPercentageAllSubmissions / 100)
            const achievedPointsPercentage = allAchievedPoints > 0
                ? allAchievedPoints / allPoints
                : 0
            const emojiIndicator = achievedPointsPercentage * 100 >= progressJsonData.options.minimumPointsPercentageAllSubmissions
                ? ` ${readmeMarkdownEmojis.greenCheck}` : ` ${readmeMarkdownEmojis.redCross}`
            if (tableStateColumnsBody.length === 0) {
                tableStateColumnsBody.push([])
            }
            tableStateColumnsBody[0].push(...[
                    `${renderFloatingPointNumber(necessaryPoints)}/${allPoints} (${progressJsonData.options.minimumPointsPercentageAllSubmissions}%)`,
                    `${allAchievedPoints}/${allPoints} (${renderPercentage(achievedPointsPercentage)}%)${emojiIndicator}`,
                ]
            )
        }
        if (progressJsonData.options.minimumSubmissions !== undefined) {
            tableStateColumnsHeader.push("Necessary submissions")
            tableStateColumnsHeader.push("Current submissions")
            const allSubmittedNonZeroSubmissions = progressJsonData.exercises.reduce((previousValue, currentValue) => {
                const isGradedNonZeroSubmission = (
                    currentValue.submission
                    && currentValue.submission.achievedPoints !== undefined
                    && currentValue.submission.achievedPoints > 0
                )
                return previousValue + (isGradedNonZeroSubmission ? 1 : 0)
            }, 0)
            const allSubmissions = progressJsonData.exercises.length
            const necessarySubmissions = progressJsonData.options.minimumSubmissions
            const emojiIndicator = allSubmittedNonZeroSubmissions >= necessarySubmissions
                ? ` ${readmeMarkdownEmojis.greenCheck}` : ` ${readmeMarkdownEmojis.redCross}`
            if (tableStateColumnsBody.length === 0) {
                tableStateColumnsBody.push([])
            }
            tableStateColumnsBody[0].push(...[
                    `${necessarySubmissions}/${allSubmissions} (${renderPercentage(necessarySubmissions / allSubmissions)}%)`,
                    `${allSubmittedNonZeroSubmissions}/${allSubmissions} (${renderPercentage(allSubmittedNonZeroSubmissions / allSubmissions)}%)${emojiIndicator}`,
                ]
            )
        }
        tableState.push(
            ...[tableStateColumnsHeader, tableStateColumnsHeader.map(a => " --- ")].map(createMdTableRow),
            ...tableStateColumnsBody.map(createMdTableRow),
            ''
        )
    }
    return [...tableState, ...tableProgressHeader, ...tableProgressBody].join('\n')
}

const help = () =>{
    console.log("updateProgress [CUSTOM_PROGRESS_JSON]\n")
    console.log("Visualizes the data of a JSON schema conform JSON file in the README file")
    console.log(`- README:                '${path.relative(process.cwd(), readmePath)}'`)
    console.log(`- JSON schema:           '${path.relative(process.cwd(), progressSchemaPath)}'`)
    console.log(`- Default JSON progress: '${path.relative(process.cwd(), defaultProgressPath)}'\n`)
    console.log(`\tCUSTOM_PROGRESS_JSON  File path to a JSON schema conform JSON file`)
}

/**
 * @returns {import('./update_progress_types').CliArgs}
 */
const parseCliArgs = () => {
    const args = process.argv.slice(2);
    /** @type {import('./update_progress_types').CliArgs} */
    let cliArgs = {}
    if (args.length === 1) {
        cliArgs.customProgressJson = { filePath: args[0] }
    } else if (args.length !== 0) {
        throw Error(`Unsupported number of arguments (${args.length}/'${args.join(',')}')!`)
    }
    return cliArgs
}

(async () => {
    try {
        const cliArgs = parseCliArgs()
        const progressJsonPath = cliArgs.customProgressJson ? cliArgs.customProgressJson.filePath : defaultProgressPath
        const progressJsonData = await getProgressJsonData(progressJsonPath)
        const newProgressContent = await renderNewProgressContent(progressJsonData)
        await updateReadmeContent(readmePath, readmeProgressIndicators(progressJsonData.progressName), newProgressContent)
    } catch (error) {
        console.error(error)
        help()
        return process.exit(1)
    }
})()
