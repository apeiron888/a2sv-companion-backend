import { SubmissionModel } from "../models/submission.js";
import { RepoConfigModel } from "../models/repoConfig.js";
import { OAuthTokenModel } from "../models/oauthToken.js";
import { SheetConfigModel } from "../models/sheetConfig.js";
import { UserModel } from "../models/user.js";
import { sha256 } from "./hash.js";
import { resolveMapping } from "./mappingService.js";
import { commitSolution } from "./githubService.js";
import { updateSheet } from "./sheetsService.js";
import { refreshGoogleToken } from "./googleAuthService.js";

export interface CreateSubmissionInput {
  userId: string;
  platform: "leetcode" | "codeforces";
  problemUrl: string;
  language: string;
  trials: number;
  timeMinutes: number;
  code: string;
}

export async function createSubmission(input: CreateSubmissionInput) {
  const codeHash = sha256(input.code);
  const submission = await SubmissionModel.create({
    userId: input.userId,
    platform: input.platform,
    problemUrl: input.problemUrl,
    language: input.language,
    trials: input.trials,
    timeMinutes: input.timeMinutes,
    code: input.code,
    codeHash,
    status: "pending"
  });

  return submission;
}

export async function processSubmission(submissionId: string) {
  const submission = await SubmissionModel.findById(submissionId);
  if (!submission) throw new Error("Submission not found");

  const repoConfig = await RepoConfigModel.findOne({ userId: submission.userId });
  if (!repoConfig) throw new Error("Repo config not found");

  const githubToken = await OAuthTokenModel.findOne({ userId: submission.userId, provider: "github" });
  if (!githubToken) throw new Error("GitHub token not found");

  const mapping = await resolveMapping(submission.problemUrl);
  if (!mapping) throw new Error("Mapping not found for problem URL");

  const sheetConfig = await SheetConfigModel.findById(mapping.sheetConfigId);
  if (!sheetConfig) throw new Error("Sheet config not found");

  const user = await UserModel.findById(submission.userId);
  const rowIdentifier = user?.sheetRowIdentifier || sheetConfig.rowKeyValue || "1";

  const googleToken = await OAuthTokenModel.findOne({ userId: sheetConfig.managerId, provider: "google" });
  if (!googleToken) throw new Error("Google token not found");

  let googleAccessToken = googleToken.accessToken;
  if (googleToken.expiresAt && googleToken.refreshToken) {
    const expiresAt = new Date(googleToken.expiresAt).getTime();
    if (Date.now() > expiresAt - 60_000) {
      const refreshed = await refreshGoogleToken(String(googleToken.userId), googleToken.refreshToken);
      if (refreshed?.accessToken) {
        googleAccessToken = refreshed.accessToken;
      }
    }
  }

  const lang = submission.language.toLowerCase();
  const extMap: Record<string, string> = {
    python: "py",
    javascript: "js",
    typescript: "ts",
    java: "java",
    cpp: "cpp",
    c: "c",
    go: "go",
    rust: "rs",
    kotlin: "kt"
  };
  const extKey = Object.keys(extMap).find((key) => lang.includes(key));
  const fileExt = extKey ? extMap[extKey] : "txt";
  const safeName = submission.problemUrl
    .replace(/^https?:\/\//, "")
    .replace(/[^a-zA-Z0-9-_./]/g, "-")
    .replace(/\.+/g, ".");
  const prefix = repoConfig.folderPath ? `${repoConfig.folderPath.replace(/\/+$/, "")}/` : "";
  const path = `${prefix}${submission.platform}/${safeName}.${fileExt}`;
  const contentBase64 = Buffer.from(submission.code).toString("base64");

  try {
    const { commitUrl } = await commitSolution({
      owner: repoConfig.repoOwner,
      repo: repoConfig.repoName,
      path,
      message: `Add solution: ${submission.platform} ${submission.problemUrl}`,
      contentBase64,
      branch: repoConfig.defaultBranch,
      accessToken: githubToken.accessToken
    });

    await SubmissionModel.findByIdAndUpdate(submissionId, { status: "committed", githubCommitUrl: commitUrl });

    const hyperlink = commitUrl ? `=HYPERLINK(\"${commitUrl}\", \"solution\")` : "";

    await updateSheet({
      sheetId: sheetConfig.sheetId,
      sheetName: sheetConfig.sheetName,
      rowIdentifier,
      rowKeyColumn: sheetConfig.rowKeyColumn,
      solutionColumn: mapping.solutionColumn,
      timeColumn: mapping.timeColumn,
      trialsColumn: mapping.trialsColumn,
      commitUrl: hyperlink,
      timeMinutes: submission.timeMinutes,
      trials: submission.trials,
      accessToken: googleAccessToken
    });

    await SubmissionModel.findByIdAndUpdate(submissionId, { status: "sheet_updated" });
    return SubmissionModel.findById(submissionId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await SubmissionModel.findByIdAndUpdate(submissionId, { status: "failed", errorMessage: message });
    throw err;
  }
}
