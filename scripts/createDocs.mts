/* eslint-disable no-console */

// Package imports
import { Application, TSConfigReader, TypeDocReader } from "typedoc";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Application();

app.options.addReader(new TSConfigReader());
app.options.addReader(new TypeDocReader());

const rootDir = path.join(__dirname, "..");
const docsDir = path.join(rootDir, "docs");

app.bootstrap();

const project = app.convert();

if (project) {
  try {
    await app.generateDocs(project, docsDir);
  } catch (err) {
    console.error(err);
  }
} else {
  throw Error("Documentation generation was not successful");
}
