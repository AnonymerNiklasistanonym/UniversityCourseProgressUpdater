/* eslint-disable no-console */

// Package imports
import path from "path";
// Relative imports
import {
  versionNumberConfig,
  versionNumberProgramMajor,
  versionNumberProgramMinor,
} from "./info.mjs";

const currentDir = process.cwd();
export const defaultReadmePath = path.join(currentDir, "README.md");
export const defaultProgressPath = path.join(currentDir, "progress.json");

export const cliArgIds = {
  customReadme: "README=",
  customProgressJson: "PROGRESS_JSON=",
} as const;

const help = () => {
  console.log("updateProgress [OPTIONS]\n");
  console.log(
    "Visualizes the data of a JSON schema conform JSON file in the README file"
  );
  console.log(
    `- Default README.md:     '${path.relative(
      process.cwd(),
      defaultReadmePath
    )}'`
  );
  console.log(
    `- Default JSON progress: '${path.relative(
      process.cwd(),
      defaultProgressPath
    )}'`
  );
  console.log("Options:");
  console.log(
    `\t${cliArgIds.customReadme}         File path to README.md file`
  );
  console.log(
    `\t${cliArgIds.customProgressJson}  File path to JSON schema conform JSON progress file`
  );
};

export interface CliArgs {
  readmeFilePath: string;
  progressJsonFilePath: string;
}

export const parseCliArgs = (args: ReadonlyArray<string>): CliArgs => {
  const cliArgs: CliArgs = {
    readmeFilePath: defaultReadmePath,
    progressJsonFilePath: defaultProgressPath,
  };
  for (const arg of args) {
    if (arg.startsWith(cliArgIds.customReadme)) {
      cliArgs.readmeFilePath = arg.substring(cliArgIds.customReadme.length);
    } else if (arg.startsWith(cliArgIds.customProgressJson)) {
      cliArgs.progressJsonFilePath = arg.substring(
        cliArgIds.customProgressJson.length
      );
    } else if (arg === "--help") {
      help();
      process.exit(0);
    } else if (arg === "--version") {
      console.log(
        `${versionNumberProgramMajor}.${versionNumberProgramMinor}.${versionNumberConfig}`
      );
      process.exit(0);
    } else {
      throw Error(`Unsupported argument '${arg}'!`);
    }
  }
  return cliArgs;
};
