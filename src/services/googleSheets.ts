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
}) {
  const { sheetId, row, trialColumn, timeColumn, trialCount, timeMinutes, commitUrl } = params;
  const sheets = getSheetsClient();

  const trialRange = `${trialColumn}${row}`;
  const timeRange = `${timeColumn}${row}`;
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
