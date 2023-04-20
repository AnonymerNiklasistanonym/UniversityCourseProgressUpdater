#!/usr/bin/env node

export interface ReadmeProgressIndicators {
  begin: string;
  end: string;
}

/**
 * @param id Id of progress comments
 * @returns Begin and end comment in README using the provided progress ID
 */
export const readmeProgressIndicators = (
  id: string
): ReadmeProgressIndicators => ({
  begin: `[//]: # (Progress ${id} begin)`,
  end: `[//]: # (Progress ${id} end)`,
});

export const readmeMarkdownEmojis = {
  greenCheck: ":heavy_check_mark:",
  redCross: ":x:",
  yellowWarning: ":warning:",
} as const;

export type TableRowValues = string[];

/**
 * @param tableRowValues Table row data
 * @returns Table row data string
 */
export const createMdTableRow = (
  tableRowValues: Readonly<TableRowValues>
): string => `| ${tableRowValues.join(" | ")} |`;

/**
 * @param header Table row header
 * @param body Table rows body
 * @returns Table row data string
 */
export const createMdTable = (
  header: Readonly<TableRowValues>,
  body: ReadonlyArray<TableRowValues>
): string =>
  [header, header.map(() => "---"), ...body].map(createMdTableRow).join("\n");

export const renderFloatingPointNumber = (number: number): string =>
  number.toFixed(2).replace(/\.00$/, "");

export const renderPercentage = (percentage: number): string =>
  renderFloatingPointNumber(percentage * 100);

export const renderDate = (date: Readonly<Date>) =>
  `${date.getFullYear()}.${("0" + (date.getMonth() + 1)).slice(-2)}.${(
    "0" + date.getDate()
  ).slice(-2)}`;

/**
 * @param readmeContent The content of the README file
 * @param progressIndicators The progress begin and start indicators
 * @param progressContent The new progress string that should be displayed in the README file
 * @returns Updated README content
 */
export const updateReadmeContent = (
  readmeContent: string,
  progressIndicators: Readonly<ReadmeProgressIndicators>,
  progressContent: string
) => {
  const readmeContentSplitAtIndicatorBegin = readmeContent.split(
    progressIndicators.begin
  );
  if (readmeContentSplitAtIndicatorBegin.length !== 2) {
    throw Error(
      `README content split at '${progressIndicators.begin}' didn't match or more than once`
    );
  }
  const readmeBeforeProgress = readmeContentSplitAtIndicatorBegin[0];
  const readmeContentSplitAtIndicatorEnd =
    readmeContentSplitAtIndicatorBegin[1].split(progressIndicators.end);
  if (readmeContentSplitAtIndicatorEnd.length !== 2) {
    throw Error(
      `README content split at '${progressIndicators.end}' didn't match or more than once`
    );
  }
  const readmeAfterProgress = readmeContentSplitAtIndicatorEnd[1];
  const newReadmeContent =
    readmeBeforeProgress +
    progressIndicators.begin +
    "\n\n" +
    progressContent +
    "\n\n" +
    progressIndicators.end +
    readmeAfterProgress;
  return newReadmeContent;
};
