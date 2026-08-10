/**
 * Helper utility to sanitize comments by stripping serial numbers, bullet points,
 * and numbering prefixes from the beginning of comment lines.
 */
export function cleanCommentLine(line: string): string {
  if (!line) return '';
  let cleaned = line.trim();
  // Strip list prefixes like "1.", "1)", "1:", "1-", "[1]", "(1)", "1.-", "•", "*", "-", etc.
  cleaned = cleaned
    .replace(/^(?:(?:\d+|\([0-9a-zA-Z]+\)|\[[0-9a-zA-Z]+\])[\.\)\:\-]+(?:\s+|(?=[a-zA-Z]))|\[\d+\]\s*|\(\d+\)\s*|[\•\*\-\–\—\>]\s*)+\s*/g, '')
    .trim();
  return cleaned;
}

/**
 * Clean a multi-line raw string of comments into array of clean comment strings
 */
export function parseAndCleanComments(rawText: string): { validComments: string[]; duplicates: string[]; hasDuplicates: boolean } {
  if (!rawText) return { validComments: [], duplicates: [], hasDuplicates: false };
  const lines = rawText.split('\n');
  const validComments: string[] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();

  lines.forEach((rawLine) => {
    const cleaned = cleanCommentLine(rawLine);
    if (!cleaned) return;
    if (seen.has(cleaned)) {
      duplicates.push(cleaned);
    } else {
      seen.add(cleaned);
      validComments.push(cleaned);
    }
  });

  return { validComments, duplicates, hasDuplicates: duplicates.length > 0 };
}
