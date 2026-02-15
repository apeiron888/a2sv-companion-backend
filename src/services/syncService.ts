import { env } from "../config/env.js";
import { PhaseModel } from "../models/Phase.js";
import { QuestionModel } from "../models/Question.js";
import { GroupSheetModel } from "../models/GroupSheet.js";
import { columnToNumber, numberToColumn } from "./columnUtils.js";
import { getSpreadsheetTabs, readHeaderGrid } from "./googleSheets.js";

const platformMap: Record<string, string> = {
  leetcode: "leetcode",
  codeforces: "codeforces",
  hackerrank: "hackerrank",
  atcoder: "atcoder",
  geeksforgeeks: "geeksforgeeks",
  "leet code": "leetcode",
  "hacker rank": "hackerrank"
};

function normalizePlatform(raw: string) {
  const key = raw.trim().toLowerCase();
  return platformMap[key] || key.replace(/\s+/g, "");
}

function slugifyTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractQuestionKeyFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const challengeIndex = parts.findIndex((part) => part === "challenges");
    if (challengeIndex >= 0 && parts[challengeIndex + 1]) {
      return parts[challengeIndex + 1];
    }
    const problemsIndex = parts.findIndex((part) => part === "problems");
    if (problemsIndex >= 0 && parts[problemsIndex + 1]) {
      return parts[problemsIndex + 1];
    }
    return parts[parts.length - 1] || "";
  } catch {
    return "";
  }
}

function parseTags(raw: string | undefined) {
  if (!raw) {
    return [] as string[];
  }
  return raw
    .split(/[,/]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function extractUrlFromCell(cell: any) {
  if (!cell) {
    return "";
  }
  if (cell.hyperlink) {
    return cell.hyperlink;
  }
  const formula = cell.userEnteredValue?.formulaValue;
  if (typeof formula === "string") {
    const match = formula.match(/HYPERLINK\(\"([^\"]+)\"/i);
    if (match?.[1]) {
      return match[1];
    }
  }
  return "";
}

function extractValue(cell: any) {
  return cell?.formattedValue?.toString().trim() || "";
}

export async function detectMasterSheetChanges(params?: { masterSheetId?: string }) {
  const masterSheetId = params?.masterSheetId || env.MASTER_SHEET_ID;
  if (!masterSheetId) {
    throw new Error("MASTER_SHEET_ID is not configured");
  }

  const tabs = await getSpreadsheetTabs(masterSheetId);
  const phases = await PhaseModel.find({ masterSheetId });
  const phaseByTab = new Map(phases.map((phase) => [phase.tabName, phase]));

  const newTabs = [] as Array<{ tabName: string; startColumn: string }>;
  const warnings = [] as Array<{
    tabName: string;
    column: string;
    issue: string;
  }>;
  const newQuestions = [] as Array<{
    tabName: string;
    platform: string;
    questionKey: string;
    title: string;
    url: string;
    difficulty: string | null;
    tags: string[];
    masterColumn: string;
    timeColumn: string;
  }>;

  for (const tab of tabs) {
    if (!tab.title) {
      continue;
    }

    const phase = phaseByTab.get(tab.title);
    const startColumn = phase?.startColumn || "E";
    if (!phase) {
      newTabs.push({ tabName: tab.title, startColumn });
    }

    const endColumn = tab.columnCount > 0 ? numberToColumn(tab.columnCount) : "Z";
    const rowData = await readHeaderGrid({
      sheetId: masterSheetId,
      tabName: tab.title,
      startColumn,
      endColumn
    });

    const startIndex = columnToNumber(startColumn);
    const endIndex = columnToNumber(endColumn);

    const existingQuestions = phase
      ? await QuestionModel.find({ phaseId: phase._id }).select({ questionKey: 1, platform: 1 })
      : [];

    const existingSet = new Set(existingQuestions.map((q) => `${q.platform}:${q.questionKey}`));

    for (let colNumber = startIndex; colNumber <= endIndex; colNumber += 2) {
      const colOffset = colNumber - startIndex;
      const row1 = rowData[0]?.values?.[colOffset];
      const row2 = rowData[1]?.values?.[colOffset];
      const row3 = rowData[2]?.values?.[colOffset];
      const row4 = rowData[3]?.values?.[colOffset];
      const row5 = rowData[4]?.values?.[colOffset];
      const row5Time = rowData[4]?.values?.[colOffset + 1];

      const title = extractValue(row5);
      if (!title) {
        continue;
      }

      const timeLabel = extractValue(row5Time).toLowerCase();
      if (timeLabel && !timeLabel.includes("min") && !timeLabel.includes("⏱")) {
        continue;
      }

      const url = extractUrlFromCell(row5);
      const difficulty = extractValue(row1) || null;
      const tags = parseTags(extractValue(row3));
      const platformRaw = extractValue(row4);
      const platform = normalizePlatform(platformRaw);
      const questionKey =
        extractQuestionKeyFromUrl(url) || (title ? slugifyTitle(title) : "");

      if (!url) {
        warnings.push({ tabName: tab.title, column: numberToColumn(colNumber), issue: "Missing URL" });
      }
      if (!platform) {
        warnings.push({
          tabName: tab.title,
          column: numberToColumn(colNumber),
          issue: "Missing platform"
        });
      }
      if (platform && !platformMap[platform]) {
        warnings.push({
          tabName: tab.title,
          column: numberToColumn(colNumber),
          issue: `Unknown platform: ${platformRaw}`
        });
      }

      if (!questionKey || !platform) {
        continue;
      }

      if (phase && existingSet.has(`${platform}:${questionKey}`)) {
        continue;
      }

      newQuestions.push({
        tabName: tab.title,
        platform,
        questionKey,
        title,
        url,
        difficulty,
        tags,
        masterColumn: numberToColumn(colNumber),
        timeColumn: numberToColumn(colNumber + 1)
      });
    }
  }

  return { masterSheetId, newTabs, newQuestions, warnings };
}

export async function checkGroupSheetTabs(params?: { masterSheetId?: string }) {
  const masterSheetId = params?.masterSheetId || env.MASTER_SHEET_ID;
  if (!masterSheetId) {
    throw new Error("MASTER_SHEET_ID is not configured");
  }

  const phases = await PhaseModel.find({ masterSheetId, active: true });
  const expectedTabs = phases.map((phase) => phase.tabName);
  const groups = await GroupSheetModel.find({ active: true });

  const results = [] as Array<{
    groupName: string;
    sheetId: string;
    missingTabs: string[];
  }>;

  for (const group of groups) {
    const tabs = await getSpreadsheetTabs(group.sheetId);
    const tabNames = new Set(tabs.map((tab) => tab.title));
    const missingTabs = expectedTabs.filter((tab) => !tabNames.has(tab));

    results.push({
      groupName: group.groupName,
      sheetId: group.sheetId,
      missingTabs
    });
  }

  return { expectedTabs, groups: results };
}
