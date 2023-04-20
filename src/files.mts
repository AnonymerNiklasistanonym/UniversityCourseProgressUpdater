// Package imports
import { promises as fs } from "fs";
// Type imports
import type { CourseProgressData } from "./progressTypes.mjs";

const readFileToString = async (filePath: string): Promise<string> => {
  const content = await fs.readFile(filePath);
  return content.toString();
};

/**
 * @param filePath The file path of the JSON data file
 * @returns Parsed course progress
 */
export const getCourseProgressData = async (
  filePath: string
): Promise<CourseProgressData> => JSON.parse(await readFileToString(filePath));

/**
 * @param filePath The file path of the README text file
 * @param updateContent Create new content
 */
export const updateReadme = async (
  filePath: string,
  updateContent: (content: string) => string
): Promise<void> => {
  await fs.writeFile(filePath, updateContent(await readFileToString(filePath)));
};
