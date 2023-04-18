#!/usr/bin/env ts-node

/* eslint-disable no-console */

import { exec } from "child_process";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import path from "path";
// Relative imports
import { cliArgIds } from "../src/cli.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CliOutputInfo {
  command: string;
  stderr: string;
  stdout: string;
}

const rootDirPath = path.join(__dirname, "..");
const updateProgressBundlePath = path.join(
  rootDirPath,
  "dist",
  "updateProgress.mjs"
);
const exampleDirPath = path.join(rootDirPath, "examples");

const runUpdateProgress = (
  customProgressJson: string,
  customReadme: string
): Promise<CliOutputInfo> =>
  new Promise((resolve, reject) => {
    const command = `node ${updateProgressBundlePath} ${cliArgIds.customProgressJson}${customProgressJson} ${cliArgIds.customReadme}${customReadme}`;
    exec(command, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }
      return resolve({ command, stderr, stdout });
    });
  });

// Main method (async wrapper)
try {
  const examples = await fs.readdir(exampleDirPath);
  const filteredExamples = examples.map((a) =>
    a.substring(0, a.lastIndexOf("."))
  );
  let result: CliOutputInfo;
  for (const example of [...new Set(filteredExamples)]) {
    result = await runUpdateProgress(
      path.join(exampleDirPath, `${example}.json`),
      path.join(exampleDirPath, `${example}.md`)
    );
    console.info(`Run '${result.command}'`);
    if (result.stdout.length > 0) {
      console.log(result.stdout);
    }
    if (result.stderr.length > 0) {
      console.warn(result.stderr);
    }
  }
} catch (error) {
  console.error(error);
  process.exit(1);
}
