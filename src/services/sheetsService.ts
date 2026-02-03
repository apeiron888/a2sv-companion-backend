export interface SheetUpdateInput {
  sheetId: string;
  sheetName: string;
  rowIdentifier: string;
  rowKeyColumn?: string;
  solutionColumn: string;
  timeColumn: string;
  trialsColumn?: string;
  commitUrl: string;
  timeMinutes: number;
  trials?: number;
  accessToken: string;
}

function buildA1(sheetName: string, column: string, row: string) {
  return `${sheetName}!${column}${row}`;
}

async function resolveRowIndex(input: SheetUpdateInput) {
  const isNumeric = /^\d+$/.test(input.rowIdentifier);
  if (!input.rowKeyColumn && isNumeric) {
    return input.rowIdentifier;
  }

  if (!input.rowKeyColumn) {
    throw new Error("rowKeyColumn is required for non-numeric row identifiers");
  }

  const range = `${input.sheetName}!${input.rowKeyColumn}:${input.rowKeyColumn}`;
  const resp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${input.sheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${input.accessToken}` }
    }
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Sheets row lookup failed: ${text}`);
  }

  const data = (await resp.json()) as { values?: string[][] };
  const columnValues = data.values?.[0] || [];
  const index = columnValues.findIndex((val) => val === input.rowIdentifier);
  if (index === -1) {
    throw new Error("Row identifier not found in key column");
  }

  return String(index + 1);
}

export async function updateSheet(input: SheetUpdateInput) {
  const rowIndex = await resolveRowIndex(input);
  const updates: Array<{ range: string; values: Array<Array<string | number>> }> = [];

  updates.push({
    range: buildA1(input.sheetName, input.solutionColumn, rowIndex),
    values: [[input.commitUrl]]
  });

  updates.push({
    range: buildA1(input.sheetName, input.timeColumn, rowIndex),
    values: [[input.timeMinutes]]
  });

  if (input.trialsColumn && typeof input.trials === "number") {
    updates.push({
      range: buildA1(input.sheetName, input.trialsColumn, rowIndex),
      values: [[input.trials]]
    });
  }

  const resp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${input.sheetId}/values:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: updates
      })
    }
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Sheets update failed: ${text}`);
  }

  return resp.json();
}
