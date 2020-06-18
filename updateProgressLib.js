#!/usr/bin/env node

// Source: https://github.com/AnonymerNiklasistanonym/UniversityCourseProgressUpdater

const fs = require('fs').promises
const path = require('path')

const defaultReadmePath = path.join(__dirname, '..', 'README.md')

const defaultProgressPath = path.join(__dirname, 'progress.json')
const progressSchemaPath = path.join(__dirname, 'progress.schema.json')

/**
 * @param {string} id Id of progress begin/end
 * @returns {import('./updateProgressTypes').ReadmeProgressIndicators}
 */
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

const versionNumberProgramMajor = 2
const versionNumberProgramMinor = 1
const versionNumberConfig = 4

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

const version = () => { console.log(`${versionNumberProgramMajor}.${versionNumberProgramMinor}.${versionNumberConfig}`) }

/**
 * @param {string[]} tableRowValues Table row data
 * @returns Table row data string
 */
const createMdTableRow = tableRowValues => '| ' + tableRowValues.join(' | ') + ' |'

/** @param {number} number Floating point number */
const renderFloatingPointNumber = (number) => number.toFixed(2).replace(/\.00$/, '')

/** @param {number} percentage Percentage */
const renderPercentage = (percentage) => renderFloatingPointNumber(percentage * 100)

/**
 * @param {string[]} args
 * @returns {import('./updateProgressTypes').CliArgs}
 */
const parseCliArgs = (args) => {
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
 * @returns {Promise<import('./progress').CourseProgressData>}
 */
const getProgressJsonData = async (filePath) => {
    const content = await fs.readFile(filePath)
    return JSON.parse(content.toString())
}

/**
 * @param {import('./progress').CourseExercise[]} exercises
 * @returns {number} The total points
 */
const getAllSubmissionPoints = (exercises) => {
    return exercises.reduce((previousValue, currentValue) => {
        if (currentValue.submission) {
            if (Array.isArray(currentValue.submission)) {
                return previousValue + currentValue.submission.reduce((previousValue, currentValue) => {
                    return previousValue + currentValue.points
                }, 0)
            } else {
                return previousValue + currentValue.submission.points
            }
        } else {
            return previousValue
        }
    }, 0)
}

/**
 * @param {import('./progress').CourseExercise[]} exercises
 * @returns {number} The total achieved points
 */
const getAllAchievedSubmissionPoints = (exercises) => {
    return exercises.reduce((previousValue, currentValue) => {
        if (currentValue.submission) {
            if (Array.isArray(currentValue.submission)) {
                return previousValue + currentValue.submission.reduce((previousValue, currentValue) => {
                    if (currentValue.achievedPoints !== undefined) {
                        return previousValue + currentValue.achievedPoints
                    } else {
                        return previousValue
                    }
                }, 0)
            } else {
                if (currentValue.submission.achievedPoints !== undefined) {
                    return previousValue + currentValue.submission.achievedPoints
                } else {
                    return previousValue
                }
            }
        } else {
            return previousValue
        }
    }, 0)
}

/**
 * @param {import('./progress').CourseExercise[]} exercises
 * @param {import('./progress').CourseRequirements} requirements
 * @returns {number} The total submitted submissions
 */
const getAllValidSubmittedSubmissions = (exercises, requirements) => {
    return exercises.reduce((previousValue, currentValue) => {
        if (currentValue.submission) {
            if (Array.isArray(currentValue.submission)) {
                const taskSubmissionCount = currentValue.submission.reduce((previousValue, currentValue) => {
                    if (currentValue.achievedPoints !== undefined) {
                        if (requirements.minimumPointsPerSubmission !== undefined
                            && currentValue.achievedPoints >= requirements.minimumPointsPerSubmission) {
                            return previousValue + 1
                        } else if (requirements.minimumPointsPercentagePerSubmission !== undefined
                                   && currentValue.achievedPoints / currentValue.points >= requirements.minimumPointsPercentagePerSubmission) {
                            return previousValue + 1
                        } else if (requirements.minimumPointsPerSubmission === undefined
                                   && requirements.minimumPointsPercentagePerSubmission === undefined) {
                            return previousValue + 1
                        }
                    }
                    return previousValue
                }, 0)

                if (taskSubmissionCount > 0) {
                    const allPoints = getAllSubmissionPoints([currentValue])
                    const allAchievedPoints = getAllAchievedSubmissionPoints([currentValue])
                    if (requirements.minimumPointsPerSubmission !== undefined
                        && allAchievedPoints >= requirements.minimumPointsPerSubmission) {
                        return previousValue + 1
                    } else if (requirements.minimumPointsPercentagePerSubmission !== undefined
                               && allAchievedPoints / allPoints >= requirements.minimumPointsPercentagePerSubmission) {
                        return previousValue + 1
                    } else if (requirements.minimumPointsPerSubmission === undefined
                               && requirements.minimumPointsPercentagePerSubmission === undefined) {
                        return previousValue + 1
                    }
                }
            } else {
                if (currentValue.submission.achievedPoints !== undefined) {
                    if (requirements.minimumPointsPerSubmission !== undefined
                        && currentValue.submission.achievedPoints >= requirements.minimumPointsPerSubmission) {
                        return previousValue + 1
                    } else if (requirements.minimumPointsPercentagePerSubmission !== undefined
                        && currentValue.submission.achievedPoints / currentValue.submission.points >= requirements.minimumPointsPercentagePerSubmission) {
                        return previousValue + 1
                    }  else if (requirements.minimumPointsPerSubmission === undefined
                        && requirements.minimumPointsPercentagePerSubmission === undefined) {
                        return previousValue + 1
                    }
                }
            }
        }
        return previousValue
    }, 0)
}

/**
 * @param {import('./progress').CourseProgressData} progressJsonData The progress.json data
 * @param {string[]} tableState
 * @param {import('./updateProgressTypes').CheckerInfo} checkerInfo
 */
const renderNewProgressContentHeader = (progressJsonData, tableState, checkerInfo) => {
    if (progressJsonData.requirements) {
        // Walking variables for a current progress/state table
        const tableStateHeader = []
        const tableStateBody = []
        // Check if a minimum points (or percentage) is defined for all submission
        if (progressJsonData.requirements.minimumPointsPercentageAllSubmissions !== undefined
            || progressJsonData.requirements.minimumPointsAllSubmissions !== undefined) {
            // Add checker for minimum points
            tableStateHeader.push("Necessary points", "Current points")
            const allPoints = getAllSubmissionPoints(progressJsonData.exercises)
            const achievedPoints = getAllAchievedSubmissionPoints(progressJsonData.exercises)
            const achievedPointsPercentage = achievedPoints > 0 ? achievedPoints / allPoints : 0
            let necessaryPoints = -1
            let necessaryPointsPercentageFromAllPoints = -1
            if (progressJsonData.requirements.minimumPointsPercentageAllSubmissions !== undefined) {
                necessaryPointsPercentageFromAllPoints = progressJsonData.requirements.minimumPointsPercentageAllSubmissions
                necessaryPoints = allPoints * necessaryPointsPercentageFromAllPoints
            } else {
                necessaryPoints = progressJsonData.requirements.minimumPointsAllSubmissions
                necessaryPointsPercentageFromAllPoints = necessaryPoints / allPoints
            }
            checkerInfo.minimumPointsAllSubmissions = {
                achievedCount: achievedPoints,
                count: necessaryPoints,
                percentage: necessaryPointsPercentageFromAllPoints
            }
            const emojiIndicator = achievedPointsPercentage >= necessaryPointsPercentageFromAllPoints
                ? ` ${readmeMarkdownEmojis.greenCheck}` : ` ${readmeMarkdownEmojis.redCross}`
            // Add information in first row of state table
            if (tableStateBody.length === 0) { tableStateBody.push([]) }
            tableStateBody[0].push(
                // Add column that tells what the necessary points (percentage) is
                `${renderFloatingPointNumber(necessaryPoints)}/${allPoints} (${renderPercentage(necessaryPointsPercentageFromAllPoints)}%)`,
                // Add column that tells what the current points (percentages) is
                `${renderFloatingPointNumber(achievedPoints)}/${allPoints} (${renderPercentage(achievedPointsPercentage)}%)${emojiIndicator}`
            )
        }
        // Check if a minimum submission count (or percentage) is defined for all submission
        if (progressJsonData.requirements.minimumSubmissionsPercentage !== undefined
            || progressJsonData.requirements.minimumSubmissions !== undefined) {
            // Add checker for minimum submissions
            tableStateHeader.push("Necessary submissions", "Current submissions")
            const allSubmissions = progressJsonData.exercises.length
            const validSubmittedSubmissions = getAllValidSubmittedSubmissions(progressJsonData.exercises, progressJsonData.requirements)
            const submittedSubmissionsPercentage = validSubmittedSubmissions > 0 ? validSubmittedSubmissions / allSubmissions : 0
            let necessarySubmissions
            let necessarySubmissionsPercentage
            if (progressJsonData.requirements.minimumSubmissionsPercentage !== undefined) {
                necessarySubmissionsPercentage = progressJsonData.requirements.minimumSubmissionsPercentage
                necessarySubmissions = allSubmissions * necessarySubmissionsPercentage
            } else {
                necessarySubmissions = progressJsonData.requirements.minimumSubmissions
                necessarySubmissionsPercentage = necessarySubmissions / allSubmissions
            }
            checkerInfo.minimumSubmissions = {
                achievedCount: validSubmittedSubmissions,
                count: necessarySubmissions,
                percentage: necessarySubmissionsPercentage
            }
            const emojiIndicator = validSubmittedSubmissions >= necessarySubmissions
                ? ` ${readmeMarkdownEmojis.greenCheck}` : ` ${readmeMarkdownEmojis.redCross}`
            // Add information in first row of state table
            if (tableStateBody.length === 0) { tableStateBody.push([]) }
            tableStateBody[0].push(
                // Add column that tells what the necessary submission count (percentage) is
                `${renderFloatingPointNumber(necessarySubmissions)}/${allSubmissions} (${renderPercentage(necessarySubmissionsPercentage)}%)`,
                // Add column that tells what the current submission count (percentage) is
                `${renderFloatingPointNumber(validSubmittedSubmissions)}/${allSubmissions} (${renderPercentage(submittedSubmissionsPercentage)}%)${emojiIndicator}`
            )
        }
        if (tableStateHeader.length > 0) {
            tableState.push(
                ...[tableStateHeader, tableStateHeader.map(() => "---")].map(createMdTableRow),
                ...tableStateBody.map(createMdTableRow),
                ""
            )
        }
    }
}

/**
 * @param {import('./progress').CourseProgressData} progressJsonData The progress.json data
 * @param {string[]} tableState
 * @param {import('./updateProgressTypes').CheckerInfo} checkerInfo
 */
const renderNewProgressContentBody = (progressJsonData, tableState, checkerInfo) => {
    const tableProgressHeader = ["Exercise" , "Points"]
    let currentlyAchievedPoints = 0
    const maximumAchievedPoints = getAllSubmissionPoints(progressJsonData.exercises)
    const tableProgressBody = progressJsonData.exercises.map(exercise => {
        // If exercise directory is given link it on the exercise number (= id)
        let id = exercise.directory ? `[${exercise.number}](${exercise.directory})` : `${exercise.number}`
        let points = ""
        if (exercise.submission) {
            currentlyAchievedPoints += getAllAchievedSubmissionPoints([exercise])
            let oneTaskWasSubmitted = false
            if (Array.isArray(exercise.submission)) {
                const allPoints = getAllSubmissionPoints([exercise])
                const allAchievedPoints = getAllAchievedSubmissionPoints([exercise])
                let pointsColumnString = exercise.submission.map(taskSubmission => {
                    if (taskSubmission.achievedPoints !== undefined) {
                        oneTaskWasSubmitted = true
                        let tempAchievedPointsPerTaskString = `${taskSubmission.achievedPoints}/${taskSubmission.points}`
                        if (taskSubmission.feedbackFile) {
                            return `[${tempAchievedPointsPerTaskString}](${
                                path.join(exercise.directory ? exercise.directory : '.', taskSubmission.feedbackFile)
                            })`
                        } else {
                            return tempAchievedPointsPerTaskString
                        }
                    } else if (allAchievedPoints > 0) {
                        return `${0}/${taskSubmission.points}`
                    } else if (taskSubmission.notSubmitted) {
                        return `~${taskSubmission.points}~`
                    }
                }).join(" + ")
                // Check if a global feedback file is given and update its path if a directory is given too
                let pointsSumColumnString = allAchievedPoints > 0 ? `${allAchievedPoints}/${allPoints}` : `${allPoints}`
                if (!oneTaskWasSubmitted) {
                    pointsSumColumnString = `~${pointsSumColumnString}~`
                }
                if (allAchievedPoints > 0 && exercise.feedbackFile) {
                    points = `${pointsColumnString} = [${pointsSumColumnString}](${
                        path.join(exercise.directory ? exercise.directory : '.', exercise.feedbackFile)
                    }) (${renderPercentage(allAchievedPoints / allPoints)}%)`
                } else {
                    points = `${pointsColumnString} = ${pointsSumColumnString}`
                }
                // If there were no points make string empty
                if (allPoints === 0) {
                    points = ""
                }
                // TODO Check for certain requirements and then serve icon if successful or unsuccessful
                if (checkerInfo.minimumPointsAllSubmissions !== undefined) {
                }
                if (checkerInfo.minimumSubmissions !== undefined) {
                }
                if (progressJsonData.requirements.minimumPointsPerSubmission !== undefined) {
                }
                if (progressJsonData.requirements.minimumPointsPercentagePerSubmission !== undefined) {
                }
            } else {
                const allPoints = getAllSubmissionPoints([exercise])
                const allAchievedPoints = getAllAchievedSubmissionPoints([exercise])
                // Check if a global feedback file is given and update its path if a directory is given too
                let pointsString = allAchievedPoints > 0 ? `${allAchievedPoints}/${allPoints}` : `${allPoints}`
                if (allAchievedPoints > 0 && exercise.feedbackFile) {
                    points = `[${pointsString}](${
                        path.join(exercise.directory ? exercise.directory : '.', exercise.feedbackFile)
                    }) (${renderPercentage(exercise.submission.achievedPoints / exercise.submission.points)}%)`
                } else {
                    points = pointsString
                }
                // If there were no points make string empty
                if (allPoints === 0) {
                    points = ""
                }
                // TODO Predictions in external method (how many points at least, are there already enough points accumulated, ...)
                // if (exercise.submission.achievedPoints !== undefined) {
                // } else {
                //     points = `${exercise.submission.points}`
                //     // Predictions if checkers are selected
                //     if (checkerInfo.minimumPointsAllSubmissions !== undefined && (
                //         progressJsonData.options.minimumPointsPercentageAllSubmissions !== undefined
                //         || progressJsonData.options.minimumPointsAllSubmissions !== undefined
                //     )) {
                //         const currentlyAchievedPoints = progressJsonData.exercises.reduce((previousValue, currentValue) =>
                //         previousValue + (
                //             (currentValue.number <= exercise.number && currentValue.submission && currentValue.submission.achievedPoints)
                //             ? currentValue.submission.achievedPoints : 0
                //         ), 0)
                //         const currentSubmissionCount = progressJsonData.exercises.reduce((previousValue, currentValue) =>
                //         previousValue + (currentValue.number <= exercise.number && currentValue.submission && currentValue.submission.achievedPoints > 0 ? 1 : 0), 0)
                //         const missingPoints = checkerInfo.minimumPointsAllSubmissions.count - currentlyAchievedPoints
                //         if (missingPoints > 0) {
                //             const upcomingExercises = progressJsonData.exercises.length - currentSubmissionCount
                //             const missingPointsPerUpcomingExercise = missingPoints / upcomingExercises
                //             points += ` (*at least ${Math.ceil(missingPointsPerUpcomingExercise)} are necessary*)`
                //         }
                //     }
                // }
                return exercise.submission.notSubmitted ? [ id, `~${points}~` ] : [ id, points ]
            }
        }
        // Return row (list of columns)
        return [ id, points ]
    })
    tableState.push(
        ...[tableProgressHeader, tableProgressHeader.map(() => "---")].map(createMdTableRow),
        ...tableProgressBody.map(createMdTableRow)
    )
}

/**
 * @param {import('./progress').CourseProgressData} progressJsonData The progress.json data
 */
const renderNewProgressContent = (progressJsonData) => {
    if (progressJsonData.version < 4) {
        throw Error("Please update the progress.json file, only version 4 or higher are supported")
    }
    const tableState = []
    /** @type {import('./updateProgressTypes').CheckerInfo} */
    const checkerInfo = {}

    // Render the summary header (progress info tables)
    renderNewProgressContentHeader(progressJsonData, tableState, checkerInfo)

    // Render main table that lists the submissions
    renderNewProgressContentBody(progressJsonData, tableState, checkerInfo)

    return [...tableState].join('\n')
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

module.exports = {
    createMdTableRow,
    getAllAchievedSubmissionPoints,
    getAllValidSubmittedSubmissions,
    getAllSubmissionPoints,
    getProgressJsonData,
    help,
    versionNumberProgramMajor,
    versionNumberProgramMinor,
    versionNumberConfig,
    parseCliArgs,
    readmeProgressIndicators,
    renderFloatingPointNumber,
    renderNewProgressContent,
    renderPercentage,
    updateReadmeContent
};
