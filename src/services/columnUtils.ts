/**
 * Convert a column letter (A, Z, AA, AZ, etc.) to a 1-based number.
 * A=1, B=2, ..., Z=26, AA=27, AB=28, ...
 */
export function columnToNumber(column: string): number {
  let result = 0;
  const normalized = column.trim().toUpperCase();
  for (let i = 0; i < normalized.length; i += 1) {
    const code = normalized.charCodeAt(i) - 64;
    if (code < 1 || code > 26) {
      throw new Error(`Invalid column: ${column}`);
    }
    result = result * 26 + code;
  }
  return result;
}

/**
 * Convert a 1-based number to a column letter.
 */
export function numberToColumn(value: number): string {
  if (value < 1) {
    throw new Error(`Invalid column number: ${value}`);
  }
  let result = "";
  let num = value;
  while (num > 0) {
    const rem = (num - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
}

export function nextQuestionColumnPair(lastQuestionColumn: string | null, startColumn: string) {
  if (!lastQuestionColumn) {
    return { questionColumn: startColumn, timeColumn: numberToColumn(columnToNumber(startColumn) + 1) };
  }
  const nextQuestionNumber = columnToNumber(lastQuestionColumn) + 2;
  return {
    questionColumn: numberToColumn(nextQuestionNumber),
    timeColumn: numberToColumn(nextQuestionNumber + 1)
  };
}
