// Package imports
import { promises as fs } from "fs";
// Type imports
import type { CourseProgressData } from "./progressTypes.mjs";

/**
 * @param filePath The file path of the progress.json file
 * @returns Parsed course progress
 */
export const getProgressJsonData = async (
  filePath: string
): Promise<CourseProgressData> => {
  const content = await fs.readFile(filePath);
  return JSON.parse(content.toString());
};

/**
 * @param filePath The file path of the README.md
 * @param updateContent Create new content
 */
export const updateReadme = async (
  filePath: string,
  updateContent: (content: string) => string
): Promise<void> => {
  const readmeContent = await fs.readFile(filePath);
  await fs.writeFile(filePath, updateContent(readmeContent.toString()));
};
