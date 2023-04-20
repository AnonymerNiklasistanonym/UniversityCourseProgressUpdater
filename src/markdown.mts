interface ReadmeCommentIndicators {
  begin: string;
  end: string;
}

/**
 * @param id ID of markdown comments
 * @param type Type ID of markdown comments
 * @returns Begin and end comment in README
 */
export const readmeCommentIndicators = (
  id: string,
  type = "Progress"
): ReadmeCommentIndicators => ({
  begin: `[//]: # (${type} ${id} begin)`,
  end: `[//]: # (${type} ${id} end)`,
});

const readmeMarkdownEmojis = {
  greenCheck: ":heavy_check_mark:",
  redCross: ":x:",
  yellowWarning: ":warning:",
} as const;

export const convertBooleanToEmoji = (value?: boolean) =>
  value === undefined
    ? readmeMarkdownEmojis.yellowWarning
    : value
    ? readmeMarkdownEmojis.greenCheck
    : readmeMarkdownEmojis.redCross;

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

export const addMarkdownIndent = (lines: ReadonlyArray<string>, indent = "") =>
  lines.map((a) => (a.length > 0 ? `${indent}${a}` : a));

/**
 * @param content The content of the README file
 * @param commentIndicators The comment begin and start indicators
 * @param generateNewContent Generate the new content between those comments
 * @returns Updated README content
 */
export const updateReadmeCommentContent = (
  content: string,
  commentIndicators: Readonly<ReadmeCommentIndicators>,
  generateNewContent: (indent: string) => string
) => {
  const splitAtBegin = content.split(commentIndicators.begin);
  if (splitAtBegin.length !== 2) {
    throw Error(
      `README content split at '${commentIndicators.begin}' didn't match exactly once (${splitAtBegin.length})`
    );
  }
  const indent = splitAtBegin[0].split("\n").slice(-1)[0];
  const splitAtEnd = splitAtBegin[1].split(commentIndicators.end);
  if (splitAtEnd.length !== 2) {
    throw Error(
      `README content split at '${commentIndicators.end}' didn't match exactly once (${splitAtEnd.length})`
    );
  }
  return (
    splitAtBegin[0] +
    commentIndicators.begin +
    "\n\n" +
    generateNewContent(indent) +
    "\n\n" +
    indent +
    commentIndicators.end +
    splitAtEnd[1]
  );
};
