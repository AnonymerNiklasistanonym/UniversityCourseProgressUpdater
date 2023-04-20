#!/usr/bin/env ts-node

import { fileURLToPath } from "url";
import path from "path";
// Relative imports
import {
  addMarkdownIndent,
  readmeCommentIndicators,
  updateReadmeCommentContent,
} from "../src/markdown.mjs";
import { cliArgIds } from "../src/cli.mjs";
import { renderNewProgressContent } from "../src/logic.mjs";
import { updateReadme } from "../src/files.mjs";
// Type imports
import type { CourseProgressData } from "../src/progressTypes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const README_FILE_PATH = path.join(__dirname, "..", "README.md");

interface UpdateReadmeComment {
  commentId: string;
  newContent: (indent: string) => string;
}

interface CourseProgressDataWithSchema extends CourseProgressData {
  $schema: string;
}

const exampleCourseProgressData: CourseProgressDataWithSchema = {
  $schema: "./progress.schema.json",
  exercises: [
    {
      directory: "ex01",
      feedbackFile: "feedback.pdf",
      name: 1,
      submission: [
        {
          achievedPoints: 12.5,
          name: "theoretical",
          points: 15,
        },
        {
          achievedPoints: 10,
          name: "programming",
          points: 15,
        },
      ],
      submissionDate: new Date(2020, 10 - 1, 6).toISOString(),
    },
  ],
  name: "Course Example 02 SS20",
  progressName: "EXAMPLE_ID",
  requirements: {
    minimumPointsPercentage: {
      allSubmissions: 0.5,
    },
    minimumPassedExercises: {
      number: 4,
    },
  },
  version: 5,
};
const courseProgressCommentIndicators = readmeCommentIndicators(
  exampleCourseProgressData.progressName
);

const updateReadmeComments: UpdateReadmeComment[] = [
  {
    commentId: "README.md",
    newContent: (indent) =>
      addMarkdownIndent(
        [
          "```markdown",
          "....",
          "# Progress title",
          "",
          `${courseProgressCommentIndicators.begin}`,
          "",
          ...renderNewProgressContent(exampleCourseProgressData).split("\n"),
          "",
          `${courseProgressCommentIndicators.end}`,
          "",
          "...",
          "```",
        ],
        indent
      ).join("\n"),
  },
  {
    commentId: "progress.json",
    newContent: (indent) =>
      addMarkdownIndent(
        [
          "```json",
          ...JSON.stringify(exampleCourseProgressData, undefined, 4).split(
            "\n"
          ),
          "```",
        ],
        indent
      ).join("\n"),
  },
  {
    commentId: "run updateProgress.mjs",
    newContent: (indent) =>
      addMarkdownIndent(
        [
          "```sh",
          `node ./progress/updateProgress.mjs ${cliArgIds.customProgressJson}progress/progress.json`,
          "```",
        ],
        indent
      ).join("\n"),
  },
];

await updateReadme(README_FILE_PATH, (content) => {
  for (const updateReadmeComment of updateReadmeComments) {
    content = updateReadmeCommentContent(
      content,
      readmeCommentIndicators(
        updateReadmeComment.commentId,
        "Markdown content"
      ),
      updateReadmeComment.newContent
    );
  }
  return content;
});
