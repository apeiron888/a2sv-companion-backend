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
}
