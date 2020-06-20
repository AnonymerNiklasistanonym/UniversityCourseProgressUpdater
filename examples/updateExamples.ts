#!/usr/bin/env ts-node

import { exec } from 'child_process'
import * as path from 'path'

interface CliOutputInfo {
    command: string
    stderr: string
    stdout: string
}

const runUpdateProgress = (customProgressJson: string, customReadme: string): Promise<CliOutputInfo> => {
    return new Promise((resolve, reject) => {
        const pathToUpdateProgress = path.join(__dirname, '..', 'updateProgress.js')
        const command = `node ${pathToUpdateProgress} CUSTOM_PROGRESS_JSON=${customProgressJson} CUSTOM_README=${customReadme}`
        exec(command, (err, stdout, stderr) => {
            if (err) {
                return reject(err)
            }
            return resolve({ command, stderr, stdout })
        })
    })
}

// Main method (async wrapper)
(async () => {
    const examples = [
        'progress_course_task_list', 'progress_course_task_summary', 'progress_course_task_mixed',
        'progress_course_task_list2', 'progress_course_task_summary2', 'progress_course_task_list3'
    ]
    let result: CliOutputInfo
    for (const example of examples) {
        result = await runUpdateProgress(path.join(__dirname, `${example}.json`), path.join(__dirname, `${example}.md`))
        console.log(result.command)
        if (result.stdout.length > 0) {
            console.log(result.stdout)
        }
        if (result.stderr.length > 0) {
            console.warn(result.stderr)
        }
    }
})().catch(error => {
    console.error(error)
    return process.exit(1)
})
