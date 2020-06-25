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
    customReadme: 'CUSTOM_README=',
    customProgressJson: 'CUSTOM_PROGRESS_JSON='
}

const readmeMarkdownEmojis = {
    greenCheck: ':heavy_check_mark:',
    redCross: ':x:',
    yellowWarning: ':warning:'
}

const versionNumberProgramMajor = 2
const versionNumberProgramMinor = 2
const versionNumberConfig = 4

const help = () => {
    console.log('updateProgress [OPTIONS]\n')
    console.log('Visualizes the data of a JSON schema conform JSON file in the README file')
    console.log(`- Default README.md:     '${path.relative(process.cwd(), defaultReadmePath)}'`)
    console.log(`- Default JSON progress: '${path.relative(process.cwd(), defaultProgressPath)}'`)
    console.log(`- JSON schema:           '${path.relative(process.cwd(), progressSchemaPath)}'\n`)
    console.log('Options:')
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
        } else if (arg === '--help') {
            help()
            process.exit(0)
        } else if (arg === '--version') {
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
 * Get count of the points of the submission
 * @param {import('./progress').CourseExercise} exercise
 * @returns {number} The total points
 */
const countSubmissionPointsExercise = (exercise) => {
    if (exercise.submission) {
        if (Array.isArray(exercise.submission)) {
            return exercise.submission.reduce((previousValue, currentValue) => {
                return previousValue + currentValue.points
            }, 0)
        } else {
            return exercise.submission.points
        }
    }
    return 0
}

/**
 * @param {import('./progress').CourseExercise[]} exercises
 * @returns {number} The total points
 */
const countSubmissionPointsExercises = (exercises) => {
    return exercises.reduce((previousValue, currentValue) => previousValue + countSubmissionPointsExercise(currentValue), 0)
}

/**
 * Get count of the achieved points of the submission
 * @param {import('./progress').CourseExercise} exercise
 * @returns {number} The total achieved points
 */
const countSubmissionAchievedPointsExercise = (exercise) => {
    if (exercise.submission) {
        if (Array.isArray(exercise.submission)) {
            return exercise.submission.reduce((previousValue, currentValue) => {
                if (currentValue.achievedPoints !== undefined) {
                    return previousValue + currentValue.achievedPoints
                } else {
                    return previousValue
                }
            }, 0)
        } else {
            if (exercise.submission.achievedPoints !== undefined) {
                return exercise.submission.achievedPoints
            }
        }
    }
    return 0
}

/**
 * Get count of the achieved points of the submission
 * @param {import('./progress').CourseExercise[]} exercises
 * @returns {number} The total achieved points
 */
const countSubmissionAchievedPointsExercises = (exercises) => {
    return exercises.reduce((previousValue, currentValue) => previousValue + countSubmissionAchievedPointsExercise(currentValue), 0)
}

/**
 * Get count of submissions that fit requirements
 * @param {import('./progress').CourseExercise[]} exercises
 * @param {import('./progress').CourseRequirements} requirements
 * @returns {number}
 */
const countSubmissions = (exercises, requirements = {}) => {
    return exercises.reduce((previousValue, currentValue) => {
        if (currentValue.submission) {
            const allPoints = countSubmissionPointsExercises([currentValue])
            const allAchievedPoints = countSubmissionAchievedPointsExercises([currentValue])
            let submissionsWereFound = true
            // Determine if achieved points exist
            if (Array.isArray(currentValue.submission)) {
                // If it is a list of tasks check if it is not empty
                const taskSubmissionCount = currentValue.submission.reduce((previousValue, currentValue) => {
                    return previousValue + (currentValue.achievedPoints !== undefined ? 1 : 0)
                }, 0)
                submissionsWereFound = (taskSubmissionCount > 0)
            } else {
                submissionsWereFound = currentValue.submission.achievedPoints !== undefined
            }
            // Check if achieved points fit the requirements
            if (submissionsWereFound) {
                if (requirements.minimumPointsPerSubmission !== undefined &&
                    allAchievedPoints >= requirements.minimumPointsPerSubmission) {
                    // Minimum points is achieved
                    return previousValue + 1
                } else if (requirements.minimumPointsPercentagePerSubmission !== undefined &&
                    allAchievedPoints / allPoints >= requirements.minimumPointsPercentagePerSubmission) {
                    // Minimum percentage is achieved
                    return previousValue + 1
                } else if (requirements.minimumPointsPerSubmission === undefined &&
                    requirements.minimumPointsPercentagePerSubmission === undefined) {
                    // No requirements
                    return previousValue + 1
                }
            }
        }
        return previousValue
    }, 0)
}

/**
 * @param {import('./progress').CourseProgressData} progressJsonData The progress.json data
 * @param {string[]} tableState
 */
const renderNewProgressContentHeader = (progressJsonData, tableState) => {
    if (progressJsonData.requirements) {
    // Walking variables for a current progress/state table
        const tableStateHeader = []
        const tableStateBody = []
        // Check if a minimum points (or percentage) is defined for all submission
        if (progressJsonData.requirements.minimumPointsPercentageAllSubmissions !== undefined ||
            progressJsonData.requirements.minimumPointsAllSubmissions !== undefined) {
            // Add columns for necessary points and the current points
            tableStateHeader.push('Necessary points', 'Current points')
            const allPoints = countSubmissionPointsExercises(progressJsonData.exercises)
            const achievedPoints = countSubmissionAchievedPointsExercises(progressJsonData.exercises)
            const achievedPointsPercentage = achievedPoints > 0 ? achievedPoints / allPoints : 0
            // Calculate the necessary points (percentage)
            let necessaryPoints
            let necessaryPointsPercentageFromAllPoints
            if (progressJsonData.requirements.minimumPointsPercentageAllSubmissions !== undefined) {
                necessaryPointsPercentageFromAllPoints = progressJsonData.requirements.minimumPointsPercentageAllSubmissions
                necessaryPoints = allPoints * necessaryPointsPercentageFromAllPoints
            } else {
                necessaryPoints = progressJsonData.requirements.minimumPointsAllSubmissions
                necessaryPointsPercentageFromAllPoints = necessaryPoints / allPoints
            }
            // Add information in first row of state table
            if (tableStateBody.length === 0) { tableStateBody.push([]) }
            const emojiIndicator = achievedPointsPercentage >= necessaryPointsPercentageFromAllPoints
                ? ` ${readmeMarkdownEmojis.greenCheck}` : ` ${readmeMarkdownEmojis.redCross}`
            tableStateBody[0].push(
                // Add column that tells what the necessary points (percentage) is
                `${renderFloatingPointNumber(necessaryPoints)}/${allPoints} (${renderPercentage(necessaryPointsPercentageFromAllPoints)}%)`,
                // Add column that tells what the current points (percentages) is
                `${renderFloatingPointNumber(achievedPoints)}/${allPoints} (${renderPercentage(achievedPointsPercentage)}%)${emojiIndicator}`
            )
        }
        // Check if a minimum submission count (or percentage) is defined for all submission
        if (progressJsonData.requirements.minimumSubmissionsPercentage !== undefined ||
            progressJsonData.requirements.minimumSubmissions !== undefined) {
            // Add columns for necessary submissions and the current submission count
            tableStateHeader.push('Necessary submissions', 'Current submissions')
            const allSubmissions = progressJsonData.exercises.length
            const validSubmittedSubmissions = countSubmissions(progressJsonData.exercises, progressJsonData.requirements)
            const submittedSubmissionsPercentage = validSubmittedSubmissions > 0 ? validSubmittedSubmissions / allSubmissions : 0
            // Calculate the necessary submission count (percentage)
            let necessarySubmissions
            let necessarySubmissionsPercentage
            if (progressJsonData.requirements.minimumSubmissionsPercentage !== undefined) {
                necessarySubmissionsPercentage = progressJsonData.requirements.minimumSubmissionsPercentage
                necessarySubmissions = allSubmissions * necessarySubmissionsPercentage
            } else {
                necessarySubmissions = progressJsonData.requirements.minimumSubmissions
                necessarySubmissionsPercentage = necessarySubmissions / allSubmissions
            }
            // Add information in first row of state table
            if (tableStateBody.length === 0) { tableStateBody.push([]) }
            const emojiIndicator = validSubmittedSubmissions >= necessarySubmissions
                ? ` ${readmeMarkdownEmojis.greenCheck}` : ` ${readmeMarkdownEmojis.redCross}`
            tableStateBody[0].push(
                // Add column that tells what the necessary submission count (percentage) is
                `${renderFloatingPointNumber(necessarySubmissions)}/${allSubmissions} (${renderPercentage(necessarySubmissionsPercentage)}%)`,
                // Add column that tells what the current submission count (percentage) is
                `${renderFloatingPointNumber(validSubmittedSubmissions)}/${allSubmissions} (${renderPercentage(submittedSubmissionsPercentage)}%)${emojiIndicator}`
            )
        }
        if (tableStateHeader.length > 0) {
            tableState.push(
                ...[tableStateHeader, tableStateHeader.map(() => '---')].map(createMdTableRow),
                ...tableStateBody.map(createMdTableRow),
                ''
            )
        }
    }
}

/**
 * Help cleaning up a list with undefined values
 * @param {(string|undefined)[]} argumentsList Arguments that are possibly undefined
 * @param {function(string[]):any} functionIfNotEmpty Function that is executed if list contains any not undefined elements
 */
const cleanupUndefinedList = (argumentsList, functionIfNotEmpty = (a) => a) => {
    const newList = argumentsList.filter(a => a !== undefined)
    return (newList.length === 0) ? undefined : functionIfNotEmpty(newList)
}

/**
 * @param {import('./progress').CourseExercise} exercise
 * @returns {boolean}
 */
const checkIfNotYetSubmittedOrPending = (exercise) => {
    if (exercise.submission === undefined || (Array.isArray(exercise.submission) && exercise.submission.length === 0)) {
        return true
    } else if (exercise.submission !== undefined && !Array.isArray(exercise.submission)) {
        return (exercise.submission.achievedPoints === undefined && exercise.submission.notSubmitted === undefined)
    } else if (Array.isArray(exercise.submission)) {
        return exercise.submission.reduce((notYetSubmitted, task) => {
            if (notYetSubmitted) {
                return task.achievedPoints === undefined && task.notSubmitted === undefined
            } else {
                return false
            }
        }, true)
    } else {
        return false
    }
}

/**
 * @param {import('./progress').CourseExercise} exercise
 * @param {import('./progress').CourseRequirements} requirements
 * @returns {{failed: boolean, note: string}}
 */
const checkRequirements = (exercise, requirements) => {
    const allPointsExercise = countSubmissionPointsExercises([exercise])
    const allAchievedPointsExercise = countSubmissionAchievedPointsExercises([exercise])
    const notYetSubmitted = checkIfNotYetSubmittedOrPending(exercise)
    if (requirements.minimumPointsPerSubmission !== undefined) {
        const infoString = `Minimum Points: ${requirements.minimumPointsPerSubmission}`
        if (notYetSubmitted) {
            return { failed: false, note: `${infoString}` }
        } else if (allAchievedPointsExercise >= requirements.minimumPointsPerSubmission) {
            return { failed: false, note: `${infoString} ${readmeMarkdownEmojis.greenCheck}` }
        } else {
            return { failed: true, note: `${infoString} ${readmeMarkdownEmojis.redCross}` }
        }
    } else if (requirements.minimumPointsPercentagePerSubmission !== undefined) {
        const infoString = `Minimum Points: ${renderPercentage(requirements.minimumPointsPercentagePerSubmission)}%`
        if (notYetSubmitted) {
            return { failed: false, note: `${infoString}` }
        } else if ((allAchievedPointsExercise / allPointsExercise) >= requirements.minimumPointsPercentagePerSubmission) {
            return { failed: false, note: `${infoString} ${readmeMarkdownEmojis.greenCheck}` }
        } else {
            return { failed: true, note: `${infoString} ${readmeMarkdownEmojis.redCross}` }
        }
    } else {
        return { failed: false, note: '' }
    }
}

/** @param {Date} date */
const convertDateToHumanReadableDate = (date) => {
    return `${date.getFullYear()}.${('0' + (date.getMonth() + 1)).slice(-2)}.${('0' + date.getDate()).slice(-2)}`
}

/**
 * @param {import('./progress').CourseExercise} exercise
 * @param {import('./progress').CourseRequirements} requirements
 * @param {{currentlyAchievedPoints: number}} walkingObject
 */
const renderExerciseRow = (exercise, requirements = {}, walkingObject = { currentlyAchievedPoints: 0 }) => {
    // If exercise directory is given link it on the exercise number (= id)
    let exerciseNameString = `${exercise.number}`
    if (exercise.name) {
        exerciseNameString += ` > ${exercise.name}`
    }
    if (exercise.directory) {
        exerciseNameString = `[${exerciseNameString}](${exercise.directory})`
    }
    if (exercise.submissionDate) {
        exerciseNameString += ` (${convertDateToHumanReadableDate(new Date(exercise.submissionDate))})`
    }
    let exercisePointsString = ''
    let notesString = ''
    if (exercise.submission) {
        walkingObject.currentlyAchievedPoints += countSubmissionAchievedPointsExercises([exercise])
        const allPointsExercise = countSubmissionPointsExercises([exercise])
        const allAchievedPointsExercise = countSubmissionAchievedPointsExercises([exercise])
        if (Array.isArray(exercise.submission)) {
            if (exercise.submission.length > 0) {
                let oneTaskWasSubmitted = false
                let oneTaskWasNotSubmitted = false
                let allTasksWereNotSubmitted = true
                const pointsColumnString = exercise.submission.map(taskSubmission => {
                    // Task name string part
                    let taskNamePart = ''
                    if (taskSubmission.name) {
                        const taskDirectory = cleanupUndefinedList([exercise.directory, taskSubmission.directory], a => path.posix.join(...a))
                        taskNamePart = taskSubmission.directory ? ` (*[${taskSubmission.name}](${taskDirectory})*)` : ` (*${taskSubmission.name}*)`
                    }
                    // Points string part
                    let pointsStringPart = ''
                    if (taskSubmission.achievedPoints !== undefined) {
                        oneTaskWasSubmitted = true
                        allTasksWereNotSubmitted = false
                        pointsStringPart = `${taskSubmission.achievedPoints}/${taskSubmission.points}`
                        if (taskSubmission.feedbackFile) {
                            const feedbackPath = cleanupUndefinedList([exercise.directory, taskSubmission.directory, taskSubmission.feedbackFile], a => path.posix.join(...a))
                            pointsStringPart = `[${pointsStringPart}](${feedbackPath})`
                        }
                    } else if (allAchievedPointsExercise > 0) {
                        pointsStringPart = `${0}/${taskSubmission.points}`
                    } else if (taskSubmission.notSubmitted) {
                        pointsStringPart = `~${taskSubmission.points}~`
                    } else {
                        pointsStringPart = `${taskSubmission.points}`
                    }
                    if (taskSubmission.notSubmitted === false) {
                        allTasksWereNotSubmitted = false
                    } else if (taskSubmission.notSubmitted === true) {
                        oneTaskWasNotSubmitted = true
                    }
                    return `${pointsStringPart}${taskNamePart}`
                }).join(' + ')
                // Check if a global feedback file is given and update its path if a directory is given too
                let pointsSumColumnString = ''
                let exercisePointsPercentageString = ''
                if (oneTaskWasSubmitted) {
                    pointsSumColumnString = `${allAchievedPointsExercise}/${allPointsExercise}`
                    exercisePointsPercentageString = ` (${renderPercentage(allAchievedPointsExercise / allPointsExercise)}%)`
                } else {
                    if (oneTaskWasNotSubmitted && allTasksWereNotSubmitted) {
                        pointsSumColumnString = `~${allPointsExercise}~`
                        exercisePointsPercentageString = ` (${renderPercentage(0)}%)`
                    } else {
                        pointsSumColumnString = `${allPointsExercise}`
                    }
                }
                if (exercise.feedbackFile) {
                    const feedbackPath = cleanupUndefinedList([exercise.directory, exercise.feedbackFile], a => path.posix.join(...a))
                    exercisePointsString = `${pointsColumnString} = [${pointsSumColumnString}](${feedbackPath})`
                } else {
                    exercisePointsString = `${pointsColumnString} = ${pointsSumColumnString}`
                }
                exercisePointsString += exercisePointsPercentageString
            }
        } else {
            const allPoints = countSubmissionPointsExercises([exercise])
            const allAchievedPoints = countSubmissionAchievedPointsExercises([exercise])
            // Check if a global feedback file is given and update its path if a directory is given too
            let exercisePointsPercentageString = ''
            if (exercise.submission.achievedPoints !== undefined) {
                exercisePointsString = `${allAchievedPoints}/${allPoints}`
                exercisePointsPercentageString = ` (${renderPercentage(allAchievedPointsExercise / allPointsExercise)}%)`
            } else {
                if (exercise.submission.notSubmitted) {
                    exercisePointsString = `${0}/${allPoints}`
                } else {
                    exercisePointsString = `${allPoints}`
                }
            }
            if (exercise.feedbackFile) {
                const feedbackPath = cleanupUndefinedList([exercise.directory, exercise.feedbackFile], a => path.posix.join(...a))
                exercisePointsString = `[${exercisePointsString}](${feedbackPath})`
            } else {

            }
            if (exercise.submission.notSubmitted) {
                exercisePointsString = `~${exercisePointsString}~`
                exercisePointsPercentageString = ` (${renderPercentage(0)}%)`
            }
            exercisePointsString += exercisePointsPercentageString
        }
        const check = checkRequirements(exercise, requirements)
        notesString += check.note
        // TODO Predictions in external method (how many points at least, are there already enough points accumulated, ...)
        // Probably add new entry to config file for this
    }
    if (exercise.notes) {
        if (notesString.length > 0) { notesString += ' - ' }
        notesString += exercise.notes
    }
    return [exerciseNameString, exercisePointsString, notesString]
}

/**
 * @param {import('./progress').CourseProgressData} progressJsonData The progress.json data
 * @param {string[]} tableState
 */
const renderNewProgressContentBody = (progressJsonData, tableState) => {
    const tableProgressHeader = ['Exercise', 'Points', 'Notes']
    // const currentlyAchievedPoints = 0
    // const maximumAchievedPoints = countSubmissionPointsExercises(progressJsonData.exercises)
    const walkingObject = { currentlyAchievedPoints: 0 }
    const tableProgressBody = progressJsonData.exercises.reduce((previousValue, currentValue) => {
        return previousValue.concat([renderExerciseRow(currentValue, progressJsonData.requirements, walkingObject)])
    }, [])
    tableState.push(
        ...[tableProgressHeader, tableProgressHeader.map(() => '---')].map(createMdTableRow),
        ...tableProgressBody.map(createMdTableRow)
    )
}

/**
 * @param {import('./progress').CourseProgressData} progressJsonData The progress.json data
 */
const renderNewProgressContent = (progressJsonData) => {
    if (progressJsonData.version < 4) {
        throw Error('Please update the progress.json file, only version 4 or higher are supported')
    }
    const tableState = []

    // Render the summary header (progress info tables)
    renderNewProgressContentHeader(progressJsonData, tableState)

    // Render main table that lists the submissions
    renderNewProgressContentBody(progressJsonData, tableState)

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
    const newReadmeContent = readmeBeforeProgress + progressIndicators.begin + '\n\n' +
        newProgressContent + '\n\n' + progressIndicators.end + readmeAfterProgress
    await fs.writeFile(filePath, newReadmeContent)
}

module.exports = {
    createMdTableRow,
    getAllAchievedSubmissionPoints: countSubmissionAchievedPointsExercises,
    getAllValidSubmittedSubmissions: countSubmissions,
    getAllSubmissionPoints: countSubmissionPointsExercises,
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
    cleanupUndefinedList,
    updateReadmeContent
}
