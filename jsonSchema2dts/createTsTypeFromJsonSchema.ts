#!/usr/bin/env ts-node

import { promises as fs } from 'fs'
import { compileFromFile } from 'json-schema-to-typescript'
import * as path from 'path'

const jsonSchemaFilePath = path.join(__dirname, '..', 'progress.schema.json')
const outputFilePath = path.join(__dirname, '..', 'progress.d.ts')
const bannerCommentFilePath = path.join(__dirname, 'bannerComment.ts');

(async () => {
    const bannerComment = await fs.readFile(bannerCommentFilePath)
    const typeFileContent = await compileFromFile(jsonSchemaFilePath, {
        bannerComment: bannerComment.toString(),
        style: {
            semi: false,
            tabWidth: 4,
            trailingComma: 'none'
        }
    })
    await fs.writeFile(outputFilePath, typeFileContent)
})().catch(error => {
    console.error(error)
    return process.exit(1)
})
