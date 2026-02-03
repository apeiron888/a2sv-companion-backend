export type Role = "student" | "manager";
export type Provider = "github" | "google";
export type Platform = "leetcode" | "codeforces";

export interface User {
  id: string;
  role: Role;
  githubUserId?: string;
  githubUsername?: string;
  googleUserId?: string;
  displayName?: string;
  sheetRowIdentifier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthToken {
  id: string;
  userId: string;
  provider: Provider;
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  expiresAt?: string;
}

export interface RepoConfig {
  id: string;
  userId: string;
  repoOwner: string;
  repoName: string;
  defaultBranch?: string;
  folderPath?: string;
}

export interface SheetConfig {
  id: string;
  managerId: string;
  sheetId: string;
  sheetName: string;
  rowKeyColumn?: string;
  rowKeyValue?: string;
}

export interface ProblemMapping {
  id: string;
  managerId: string;
  platform: Platform;
  problemUrl: string;
  solutionColumn: string;
  timeColumn: string;
  trialsColumn?: string;
}

export interface Submission {
  id: string;
  userId: string;
  platform: Platform;
  problemUrl: string;
  language: string;
  trials: number;
  timeMinutes: number;
  codeHash: string;
  githubCommitUrl?: string;
  status: "pending" | "committed" | "sheet_updated" | "failed";
  errorMessage?: string;
  createdAt: string;
}
