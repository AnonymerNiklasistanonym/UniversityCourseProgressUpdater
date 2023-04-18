#!/usr/bin/env ts-node

import * as TJS from "typescript-json-schema";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import path from "path";

interface OutputJsonSchema {
  typeName: string;
  outputFilePath: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const settings: TJS.PartialArgs = {
  // Create required array for non-optional properties.
  required: true,
};
const compilerOptions: TJS.CompilerOptions = {
  strictNullChecks: true,
};

const rootDir = path.join(__dirname, "..");
const inputTypeDefinitions = [path.join(rootDir, "src", "progressTypes.mts")];
const outputJsonSchemas: OutputJsonSchema[] = [
  {
    typeName: "CourseProgressData",
    outputFilePath: path.join(rootDir, "progress.schema.json"),
  },
];

try {
  const program = TJS.getProgramFromFiles(
    inputTypeDefinitions,
    compilerOptions
  );
  for (const outputJsonSchema of outputJsonSchemas) {
    const configSchema = TJS.generateSchema(
      program,
      outputJsonSchema.typeName,
      settings
    );
    if (configSchema == null) {
      throw Error(
        `${outputJsonSchema.typeName} schema could not be generated!`
      );
    }
    await fs.writeFile(
      outputJsonSchema.outputFilePath,
      JSON.stringify(configSchema, undefined, 4)
    );
  }
} catch (error) {
  console.error(error);
  process.exit(1);
}
