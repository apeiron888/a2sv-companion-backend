import { google } from "googleapis";
import { env } from "../config/env.js";

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

function parseServiceAccountKey(raw: string) {
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_KEY_BASE64. Provide base64-encoded JSON key.");
    }
  }
}

function getSheetsClient() {
  if (sheetsClient) {
    return sheetsClient;
  }
  if (!env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 is not set");
  }

  const credentials = parseServiceAccountKey(env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

export async function findUserRow(params: {
  sheetId: string;
  nameColumn: string;
  startRow: number;
  endRow: number;
  fullName: string;
}) {
  const { sheetId, nameColumn, startRow, endRow, fullName } = params;
  const range = `${nameColumn}${startRow}:${nameColumn}${endRow}`;
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range
  });

  const values = response.data.values || [];
  const normalized = fullName.trim().toLowerCase();

  for (let i = 0; i < values.length; i += 1) {
    const cellValue = (values[i]?.[0] || "").toString().trim().toLowerCase();
    if (cellValue === normalized) {
      return startRow + i;
    }
  }
  return null;
}

export async function updateTrialAndTime(params: {
  sheetId: string;
  row: number;
  trialColumn: string;
  timeColumn: string;
  trialCount: number;
  timeMinutes: number;
  commitUrl: string;
  tabName?: string;
}) {
  const { sheetId, row, trialColumn, timeColumn, trialCount, timeMinutes, commitUrl, tabName } = params;
  const sheets = getSheetsClient();

  const prefix = tabName ? `'${tabName}'!` : "";
  const trialRange = `${prefix}${trialColumn}${row}`;
  const timeRange = `${prefix}${timeColumn}${row}`;
  const trialFormula = `=HYPERLINK("${commitUrl}", "${trialCount}")`;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        { range: trialRange, values: [[trialFormula]] },
        { range: timeRange, values: [[timeMinutes]] }
      ]
    }
  });
}

/**
 * Read a range of cells from a sheet.
 */
export async function readRange(sheetId: string, range: string): Promise<string[][]> {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range
  });
  return (response.data.values as string[][]) || [];
}

/**
 * Get the numeric sheet ID (gid) for a tab by its name.
 */
export async function getSheetGidByName(sheetId: string, tabName: string): Promise<number> {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    fields: "sheets.properties"
  });

  const sheet = response.data.sheets?.find(
    (s) => s.properties?.title === tabName
  );

  if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
    throw new Error(`Tab "${tabName}" not found in spreadsheet`);
  }

  return sheet.properties.sheetId;
}

/**
 * Color constants for difficulty levels.
 */
export const DIFFICULTY_COLORS: Record<string, { red: number; green: number; blue: number }> = {
  Easy: { red: 0.0, green: 1.0, blue: 0.0 },
  Medium: { red: 1.0, green: 0.65, blue: 0.0 },
  Hard: { red: 1.0, green: 0.0, blue: 0.0 }
};

export const DIFFICULTY_TEXT_COLORS: Record<string, { red: number; green: number; blue: number }> = {
  Easy: { red: 0.0, green: 0.0, blue: 0.0 },
  Medium: { red: 0.0, green: 0.0, blue: 0.0 },
  Hard: { red: 1.0, green: 1.0, blue: 1.0 }
};

/**
 * Color constants for platforms.
 */
export const PLATFORM_COLORS: Record<string, { red: number; green: number; blue: number }> = {
  leetcode: { red: 1.0, green: 0.65, blue: 0.0 },
  codeforces: { red: 0.12, green: 0.56, blue: 1.0 },
  hackerrank: { red: 0.0, green: 0.78, blue: 0.33 }
};

export const PLATFORM_DISPLAY_NAMES: Record<string, string> = {
  leetcode: "LeetCode",
  codeforces: "Codeforces",
  hackerrank: "HackerRank"
};

/** Question title column background */
const QUESTION_TITLE_BG = { red: 0.29, green: 0.53, blue: 0.78 };
/** Time label column background */
const TIME_LABEL_BG = { red: 0.71, green: 0.78, blue: 0.86 };
/** White text */
const WHITE_TEXT = { red: 1.0, green: 1.0, blue: 1.0 };
/** Black text */
const BLACK_TEXT = { red: 0.0, green: 0.0, blue: 0.0 };

import { columnToNumber } from "./columnUtils.js";

/**
 * Write question header data to the Master Sheet with full formatting.
 */
export async function writeQuestionHeaderToSheet(params: {
  sheetId: string;
  tabName: string;
  questionColumn: string;
  timeColumn: string;
  title: string;
  difficulty: string;
  platform: string;
  tags: string[];
  url: string;
}) {
  const { sheetId, tabName, questionColumn, timeColumn, title, difficulty, platform, tags, url } = params;
  const sheets = getSheetsClient();

  const prefix = `'${tabName}'!`;

  // 1) Write values
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        { range: `${prefix}${questionColumn}1`, values: [[difficulty]] },
        { range: `${prefix}${timeColumn}1`, values: [[""]] },
        { range: `${prefix}${questionColumn}2`, values: [["0%"]] },
        { range: `${prefix}${timeColumn}2`, values: [["0"]] },
        { range: `${prefix}${questionColumn}3`, values: [[tags.join(", ")]] },
        { range: `${prefix}${timeColumn}3`, values: [[""]] },
        { range: `${prefix}${questionColumn}4`, values: [[PLATFORM_DISPLAY_NAMES[platform] || platform]] },
        { range: `${prefix}${timeColumn}4`, values: [[""]] },
        { range: `${prefix}${questionColumn}5`, values: [[title]] },
        { range: `${prefix}${timeColumn}5`, values: [["⏱ min"]] }
      ]
    }
  });

  // 2) Apply formatting
  const sheetGid = await getSheetGidByName(sheetId, tabName);
  const qColIndex = columnToNumber(questionColumn) - 1; // 0-based
  const tColIndex = columnToNumber(timeColumn) - 1;

  const diffBg = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.Easy;
  const diffText = DIFFICULTY_TEXT_COLORS[difficulty] || BLACK_TEXT;
  const platBg = PLATFORM_COLORS[platform] || PLATFORM_COLORS.leetcode;

  const requests: any[] = [
    // Row 1: Difficulty (question column)
    makeCellFormatRequest(sheetGid, 0, 1, qColIndex, qColIndex + 1, {
      backgroundColor: diffBg,
      textColor: diffText,
      bold: true,
      fontSize: 11,
      hAlign: "CENTER"
    }),
    // Row 2: Completion % (question column)
    makeCellFormatRequest(sheetGid, 1, 2, qColIndex, qColIndex + 1, {
      fontSize: 11,
      hAlign: "CENTER"
    }),
    // Row 3: Tags (question column)
    makeCellFormatRequest(sheetGid, 2, 3, qColIndex, qColIndex + 1, {
      fontSize: 11,
      hAlign: "CENTER"
    }),
    // Row 4: Platform (question column)
    makeCellFormatRequest(sheetGid, 3, 4, qColIndex, qColIndex + 1, {
      backgroundColor: platBg,
      textColor: WHITE_TEXT,
      bold: true,
      fontSize: 11,
      hAlign: "CENTER"
    }),
    // Row 5: Question title (question column)
    makeCellFormatRequest(sheetGid, 4, 5, qColIndex, qColIndex + 1, {
      backgroundColor: QUESTION_TITLE_BG,
      textColor: WHITE_TEXT,
      bold: true,
      fontSize: 11,
      hAlign: "CENTER",
      wrapStrategy: "WRAP"
    }),
    // Row 5: Time label (time column)
    makeCellFormatRequest(sheetGid, 4, 5, tColIndex, tColIndex + 1, {
      backgroundColor: TIME_LABEL_BG,
      textColor: BLACK_TEXT,
      fontSize: 11,
      hAlign: "CENTER"
    }),
    // Column width: question column = 130px
    {
      updateDimensionProperties: {
        range: {
          sheetId: sheetGid,
          dimension: "COLUMNS",
          startIndex: qColIndex,
          endIndex: qColIndex + 1
        },
        properties: { pixelSize: 130 },
        fields: "pixelSize"
      }
    },
    // Column width: time column = 60px
    {
      updateDimensionProperties: {
        range: {
          sheetId: sheetGid,
          dimension: "COLUMNS",
          startIndex: tColIndex,
          endIndex: tColIndex + 1
        },
        properties: { pixelSize: 60 },
        fields: "pixelSize"
      }
    }
  ];

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { requests }
  });
}

function makeCellFormatRequest(
  sheetId: number,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
  opts: {
    backgroundColor?: { red: number; green: number; blue: number };
    textColor?: { red: number; green: number; blue: number };
    bold?: boolean;
    fontSize?: number;
    hAlign?: string;
    wrapStrategy?: string;
  }
) {
  const cellFormat: any = {};
  const fields: string[] = [];

  if (opts.backgroundColor) {
    cellFormat.backgroundColor = opts.backgroundColor;
    fields.push("userEnteredFormat.backgroundColor");
  }

  const textFormat: any = {};
  if (opts.textColor) {
    textFormat.foregroundColor = opts.textColor;
    fields.push("userEnteredFormat.textFormat.foregroundColor");
  }
  if (opts.bold !== undefined) {
    textFormat.bold = opts.bold;
    fields.push("userEnteredFormat.textFormat.bold");
  }
  if (opts.fontSize !== undefined) {
    textFormat.fontSize = opts.fontSize;
    fields.push("userEnteredFormat.textFormat.fontSize");
  }
  if (Object.keys(textFormat).length > 0) {
    cellFormat.textFormat = textFormat;
  }

  if (opts.hAlign) {
    cellFormat.horizontalAlignment = opts.hAlign;
    fields.push("userEnteredFormat.horizontalAlignment");
  }

  if (opts.wrapStrategy) {
    cellFormat.wrapStrategy = opts.wrapStrategy;
    fields.push("userEnteredFormat.wrapStrategy");
  }

  return {
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: startRow,
        endRowIndex: endRow,
        startColumnIndex: startCol,
        endColumnIndex: endCol
      },
      cell: { userEnteredFormat: cellFormat },
      fields: fields.join(",")
    }
  };
}
