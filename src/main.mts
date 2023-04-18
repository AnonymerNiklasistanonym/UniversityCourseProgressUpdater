#!/usr/bin/env node

// Source: https://github.com/AnonymerNiklasistanonym/UniversityCourseProgressUpdater

// Relative imports
import { cutoffVersion, versionNumberConfig } from "./info.mjs";
import { getProgressJsonData, updateReadme } from "./files.mjs";
import { readmeProgressIndicators, updateReadmeContent } from "./markdown.mjs";
import { parseCliArgs } from "./cli.mjs";
import { renderNewProgressContent } from "./logic.mjs";

// Main method (async wrapper)
try {
  const cliArgs = parseCliArgs(process.argv.slice(2));
  const progressJsonData = await getProgressJsonData(
    cliArgs.progressJsonFilePath
  );
  if (progressJsonData.version > versionNumberConfig) {
    console.warn(
      `The progress JSON file references a version later than this program supports (${progressJsonData.version}).`
    );
    console.warn(
      "Try to update this program for the full support of all features and configurations."
    );
  }
  if (progressJsonData.version < cutoffVersion) {
    throw Error(
      `The read progress version (JSON) is unsupported, please update it to version ${cutoffVersion} or later`
    );
  }
  await updateReadme(cliArgs.readmeFilePath, (content) =>
    updateReadmeContent(
      content,
      readmeProgressIndicators(progressJsonData.progressName),
      renderNewProgressContent(progressJsonData)
    )
  );
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
