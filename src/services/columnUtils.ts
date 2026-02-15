<<<<<<< HEAD
/**
 * Convert a column letter (A, Z, AA, AZ, etc.) to a 1-based number.
 * A=1, B=2, ..., Z=26, AA=27, AB=28, ...
 */
export function columnToNumber(col: string): number {
    let result = 0;
    const upper = col.toUpperCase();
    for (let i = 0; i < upper.length; i++) {
        result = result * 26 + (upper.charCodeAt(i) - 64);
    }
    return result;
}

/**
 * Convert a 1-based number to a column letter.
 * 1=A, 26=Z, 27=AA, 28=AB, ...
 */
export function numberToColumn(num: number): string {
    let result = "";
    let n = num;
    while (n > 0) {
        n -= 1;
        result = String.fromCharCode(65 + (n % 26)) + result;
        n = Math.floor(n / 26);
    }
    return result;
}

/**
 * Given the current question column, return the next question column pair.
 * Each question occupies 2 columns: [questionCol, timeCol].
 * The next question starts 2 columns after the current question column.
 */
export function getNextColumnPair(lastQuestionColumn: string | null, startColumn: string): {
    questionColumn: string;
    timeColumn: string;
} {
    if (!lastQuestionColumn) {
        const startNum = columnToNumber(startColumn);
        return {
            questionColumn: startColumn,
            timeColumn: numberToColumn(startNum + 1)
        };
    }

    const lastNum = columnToNumber(lastQuestionColumn);
    const nextQuestionNum = lastNum + 2;
    return {
        questionColumn: numberToColumn(nextQuestionNum),
        timeColumn: numberToColumn(nextQuestionNum + 1)
    };
=======
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
>>>>>>> 8c60849 (feat: implement master sheet synchronization functionality with new endpoints and UI components)
}
