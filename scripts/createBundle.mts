#!/usr/bin/env ts-node

/* eslint-disable no-console */

import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.join(__dirname, "..", "dist");
const buildFiles = await fs.readdir(buildDir);
const bundleFileName = "updateProgress.mjs";
const bundleFile = path.join(buildDir, bundleFileName);
const mainFileName = "main.mjs";

const shebang = "#!/usr/bin/env node";
const source =
  "// Source: https://github.com/AnonymerNiklasistanonym/UniversityCourseProgressUpdater";
const importPrefix = "import ";
const exportPrefix = "export ";
const linesToIgnore = [
  "/* eslint-disable",
  "// Package imports",
  "// Relative imports",
  "// Type imports",
  "export {}",
];

let bundleContent = "";
let bundleContentMain = "";

const imports: string[] = [];

const filterImports = (content: string) => {
  let filteredContent = "";
  for (const line of content.split("\n")) {
    if (line.startsWith(importPrefix)) {
      imports.push(line);
    } else if (
      [...linesToIgnore, shebang, source].some((a) => line.startsWith(a)) ||
      line.trim().length === 0
    ) {
      // Do nothing
    } else if (line.startsWith(exportPrefix)) {
      filteredContent += `${line.substring(exportPrefix.length)}\n`;
    } else {
      filteredContent += `${line}\n`;
    }
  }
  return filteredContent;
};

console.info("Bundle files:");
for (const buildFile of buildFiles) {
  if (buildFile.endsWith(bundleFileName) || !buildFile.endsWith(".mjs")) {
    continue;
  }
  const buildFilePath = path.join(buildDir, buildFile);
  console.info(`${buildFilePath}...`);
  const buildFileContent = await fs.readFile(buildFilePath);
  if (buildFile.endsWith(mainFileName)) {
    bundleContentMain += filterImports(buildFileContent.toString());
  } else {
    bundleContent += filterImports(buildFileContent.toString());
  }
}
const filteredImports = [
  ...new Set(imports.filter((a) => !a.endsWith('.mjs";'))),
];

await fs.writeFile(
  bundleFile,
  [
    `${shebang}\n${source}\n`,
    ...filteredImports,
    bundleContent,
    bundleContentMain,
  ].join("\n")
);
console.info(`Wrote bundled files to ${bundleFile}`);
