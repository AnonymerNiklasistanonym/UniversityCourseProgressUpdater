/* eslint-disable no-console */

// Mocha imports
import { describe, it } from "mocha";
// Package imports
import assert from "assert";
import { fileURLToPath } from "url";
import path from "path";
//import sinon from "sinon";
// Relative imports
import {
  cliArgIds,
  defaultProgressPath,
  defaultReadmePath,
  parseCliArgs,
} from "../src/cli.mjs";
import {
  createMdTableRow,
  readmeCommentIndicators,
  renderFloatingPointNumber,
  renderPercentage,
} from "../src/markdown.mjs";
//import {
//  versionNumberConfig,
//  versionNumberProgramMajor,
//  versionNumberProgramMinor,
//} from "../src/info.mjs";
import { cleanupUndefinedList } from "../src/util.mjs";
import { getCourseProgressData } from "../src/files.mjs";
// Type imports
import type { CliArgs } from "../src/cli.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Helper functions", () => {
  describe("renderPercentage()", () => {
    it("Correct rendering of percentages to strings", () => {
      assert.equal(renderPercentage(1), "100");
      assert.equal(renderPercentage(0.1), "10");
      assert.equal(renderPercentage(0.01), "1");
      assert.equal(renderPercentage(0.53), "53");
    });
  });

  describe("renderFloatingPointNumber()", () => {
    it("Correct rendering of integer numbers to strings", () => {
      assert.equal(renderFloatingPointNumber(1), "1");
      assert.equal(renderFloatingPointNumber(10), "10");
      assert.equal(renderFloatingPointNumber(5), "5");
    });
    it("Correct rendering of floating point numbers to strings", () => {
      assert.equal(renderFloatingPointNumber(1.2345), "1.23");
      assert.equal(renderFloatingPointNumber(1.235), "1.24");
      assert.equal(renderFloatingPointNumber(0.1), "0.10");
      assert.equal(renderFloatingPointNumber(0.01), "0.01");
      assert.equal(renderFloatingPointNumber(0.53), "0.53");
    });
  });

  describe("createMdTableRow()", () => {
    it("Correct rendering string arguments to markdown table row", () => {
      assert.equal(
        createMdTableRow(["Column1", "Column2", "Column3"]),
        "| Column1 | Column2 | Column3 |"
      );
      assert.equal(
        createMdTableRow(["TestColumn1", "TestColumn2", "TestColumn3"]),
        "| TestColumn1 | TestColumn2 | TestColumn3 |"
      );
      assert.equal(
        createMdTableRow(["---", "---", "---"]),
        "| --- | --- | --- |"
      );
    });
  });

  describe("readmeProgressIndicators()", () => {
    it("Correct creation of progress indicators for markdown readme document", () => {
      assert.deepEqual(readmeCommentIndicators("Example"), {
        begin: "[//]: # (Progress Example begin)",
        end: "[//]: # (Progress Example end)",
      });
      assert.deepEqual(readmeCommentIndicators("Example 02"), {
        begin: "[//]: # (Progress Example 02 begin)",
        end: "[//]: # (Progress Example 02 end)",
      });
    });
  });

  describe("cleanupUndefinedList()", () => {
    it("Correct return values", () => {
      assert.deepEqual(
        cleanupUndefinedList(["Example1"], (a) => a),
        ["Example1"]
      );
      assert.deepEqual(
        cleanupUndefinedList(["Example2", undefined, undefined], (a) => a),
        ["Example2"]
      );
      assert.deepEqual(
        cleanupUndefinedList([undefined, "Example3", undefined], (a) => a),
        ["Example3"]
      );
      assert.deepEqual(
        cleanupUndefinedList([undefined, undefined], (a) => a),
        undefined
      );
      assert.deepEqual(
        cleanupUndefinedList([], (a) => a),
        undefined
      );
      assert.deepEqual(
        cleanupUndefinedList(["Example1", undefined, "Example2"], (a) => a),
        ["Example1", "Example2"]
      );
      assert.deepEqual(
        cleanupUndefinedList(
          ["Example1", undefined, "Example2", undefined],
          (a) => a.join(",")
        ),
        "Example1,Example2"
      );
    });
  });
});

describe("File system functions", () => {
  describe("getProgressJsonData()", () => {
    it("Successful loading of example progress data", async () => {
      assert(
        (await getCourseProgressData(
          path.join(
            __dirname,
            "..",
            "examples",
            "progress_course_task_list.json"
          )
        )) !== undefined
      );
      assert(
        (await getCourseProgressData(
          path.join(
            __dirname,
            "..",
            "examples",
            "progress_course_task_summary.json"
          )
        )) !== undefined
      );
    });
  });
});

describe("CLI functions", () => {
  describe("parseCliArgs()", () => {
    it("Correct parsing of CLI args", () => {
      const cliArgs1 = parseCliArgs([
        `${cliArgIds.customReadme}README_TEST.md`,
        `${cliArgIds.customProgressJson}progress_test.json`,
      ]);
      const cliArgs1Expected: CliArgs = {
        readmeFilePath: "README_TEST.md",
        progressJsonFilePath: "progress_test.json",
      };
      assert.deepEqual(cliArgs1, cliArgs1Expected);

      const cliArgs2 = parseCliArgs([
        `${cliArgIds.customReadme}README_TEST1.md`,
      ]);
      const cliArgs2Expected: CliArgs = {
        readmeFilePath: "README_TEST1.md",
        progressJsonFilePath: defaultProgressPath,
      };
      assert.deepEqual(cliArgs2, cliArgs2Expected);

      const cliArgs3 = parseCliArgs([
        `${cliArgIds.customProgressJson}progress2_test.json`,
      ]);
      const cliArgs3Expected: CliArgs = {
        progressJsonFilePath: "progress2_test.json",
        readmeFilePath: defaultReadmePath,
      };
      assert.deepEqual(cliArgs3, cliArgs3Expected);
    });

    /*
    it("Correct parsing of process exiting CLI arg --help", () => {
      sinon.stub(process, "exit");
      sinon.stub(console, "log");
      sinon.assert.isSinonProxy(process.exit);

      parseCliArgs(["--help"]);

      sinon.assert.calledWith(0, process.exit);
      sinon.restore(process.exit);
      sinon.assert.called(console.log);
      sinon.restore(console.log);
    });

    it("Correct parsing of process exiting CLI arg --version", () => {
      sinon.stub(process, "exit");
      sinon.stub(console, "log");
      sinon.assert.isSinonProxy(process.exit);

      parseCliArgs(["--version"]);

      sinon.assert.calledWith(process.exit, 0);
      sinon.restore(process.exit);
      sinon.assert.called(console.log);
      sinon.assert.calledWith(
        console.log,
        `${versionNumberProgramMajor}.${versionNumberProgramMinor}.${versionNumberConfig}`
      );
      sinon.restore(console.log);
    });

    it("Correct parsing of process exiting CLI unsupported arg", () => {
      sinon.stub(process, "exit");
      sinon.stub(console, "log");
      sinon.assert.isSinonProxy(process.exit);

      try {
        parseCliArgs(["--unsupported"]);
        assert(false);
      } catch (error) {
        assert.equal(
          (error as Error).message,
          "Unsupported argument '--unsupported'!"
        );
      }

      sinon.restore(process.exit);
      sinon.restore(console.log);
    });
    */
  });
});
