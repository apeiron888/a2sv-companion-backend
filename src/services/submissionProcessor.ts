import { SubmissionModel } from "../models/Submission.js";
import { UserModel } from "../models/User.js";
import { QuestionModel } from "../models/Question.js";
import { GroupSheetModel } from "../models/GroupSheet.js";
import { QuestionGroupMappingModel } from "../models/QuestionGroupMapping.js";
import { upsertRepoFile } from "./github.js";
import { updateTrialAndTime } from "./googleSheets.js";
import { decryptSecret } from "./crypto.js";

const languageExtensions: Record<string, string> = {
  python: "py",
  "python3": "py",
  cpp: "cpp",
  "c++": "cpp",
  javascript: "js",
  typescript: "ts",
  java: "java"
};

function resolveExtension(language: string) {
  const key = language.trim().toLowerCase();
  return languageExtensions[key] || "txt";
}

export async function processSubmission(submissionId: string) {
  const submission = await SubmissionModel.findById(submissionId);
  if (!submission) {
    return;
  }

  submission.status = "processing";
  await submission.save();

  try {
    const user = await UserModel.findById(submission.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const githubToken = user.githubAccessTokenEnc
      ? decryptSecret(user.githubAccessTokenEnc)
      : user.githubAccessToken;

    if (user.status !== "active" || !githubToken || !user.githubRepo) {
      throw new Error("User is not ready for submissions");
    }

    const question = await QuestionModel.findById(submission.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    const groupSheet = await GroupSheetModel.findOne({ groupName: user.groupName, active: true });
    if (!groupSheet) {
      throw new Error("Group sheet not configured");
    }

    const mapping = await QuestionGroupMappingModel.findOne({
      questionId: question._id,
      groupId: groupSheet._id
    });

    if (!mapping) {
      throw new Error("Question mapping not configured for group");
    }

    const extension = resolveExtension(submission.language);
    const filePath = `${question.platform}/${question.questionKey}.${extension}`;
    const commitUrl = await upsertRepoFile({
      accessToken: githubToken,
      repoFullName: user.githubRepo,
      path: filePath,
      content: submission.code,
      message: `Add solution for ${question.questionKey}`
    });

    if (!commitUrl) {
      throw new Error("Failed to retrieve GitHub commit URL");
    }

    await updateTrialAndTime({
      sheetId: groupSheet.sheetId,
      row: user.sheetRow,
      trialColumn: mapping.trialColumn,
      timeColumn: mapping.timeColumn,
      trialCount: submission.trialCount,
      timeMinutes: submission.timeMinutes,
      commitUrl
    });

    submission.githubCommitUrl = commitUrl;
    submission.status = "completed";
    submission.sheetUpdated = true;
    submission.errorMessage = undefined;
    await submission.save();
  } catch (error: any) {
    submission.status = "failed";
    submission.errorMessage = error?.message || "Submission processing failed";
    await submission.save();
  }
}
