// Relative imports
import {
  addMarkdownIndent,
  readmeCommentIndicators,
  updateReadmeCommentContent,
} from "./markdown.mjs";
import { cutoffVersion, versionNumberConfig } from "./info.mjs";
import { getCourseProgressData, updateReadme } from "./files.mjs";
import { parseCliArgs } from "./cli.mjs";
import { renderNewProgressContent } from "./render.mjs";

// Main method (async wrapper)
try {
  const cliArgs = parseCliArgs(process.argv.slice(2));
  const progressJsonData = await getCourseProgressData(
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
    updateReadmeCommentContent(
      content,
      readmeCommentIndicators(progressJsonData.progressName),
      (indent) =>
        addMarkdownIndent(
          renderNewProgressContent(progressJsonData).split("\n"),
          indent
        ).join("\n")
    )
  );
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
