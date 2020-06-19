#!/usr/bin/env node

const { exec } = require('child_process')
const path = require('path')

const runUpdateProgress = (customProgressJson, customReadme) => {
    return new Promise((resolve, reject) => {
        const pathToUpdateProgress = path.join(__dirname, '..', 'updateProgress.js')
        const command = `${pathToUpdateProgress} CUSTOM_PROGRESS_JSON=${customProgressJson} CUSTOM_README=${customReadme}`
        console.log(command)
        exec(command, (err, stdout, stderr) => {
            if (err) {
                return reject(err)
            }
            return resolve({ stderr, stdout })
        })
    })
}

// Main method (async wrapper)
(async () => {
    try {
        const examples = [
            'progress_course_task_list', 'progress_course_task_summary', 'progress_course_task_mixed',
            'progress_course_task_list2', 'progress_course_task_summary2', 'progress_course_task_list3'
        ]
        let result
        for (const example of examples) {
            result = await runUpdateProgress(path.join(__dirname, `${example}.json`), path.join(__dirname, `${example}.md`))
            console.log(result)
        }
    } catch (error) {
        console.error(error)
        return process.exit(1)
    }
})()
