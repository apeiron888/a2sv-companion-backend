import { Router, type Response } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { UserModel } from "../models/User.js";
import { QuestionModel } from "../models/Question.js";
import { SubmissionModel } from "../models/Submission.js";
import { addSubmissionJob } from "../queue/submissionQueue.js";

export const submissionsRouter = Router();

const submissionSchema = z.object({
  question_url: z.string().url(),
  question_key: z.string().min(1),
  title: z.string().min(1),
  code: z.string().min(1),
  language: z.string().min(1),
  trial_count: z.coerce.number().int().min(1),
  time_minutes: z.coerce.number().int().min(0)
});

async function handleSubmission(req: AuthRequest, res: Response, platform: "leetcode" | "codeforces") {
  const payload = submissionSchema.parse(req.body);
  const user = await UserModel.findById(req.userId);

  if (!user || user.status !== "active") {
    return res.status(403).json({ success: false, message: "User not active" });
  }
  if (!user.githubAccessToken || !user.githubRepo) {
    return res.status(400).json({ success: false, message: "GitHub not connected" });
  }

  const question = await QuestionModel.findOne({
    platform,
    questionKey: payload.question_key
  });

  if (!question) {
    return res.status(404).json({ success: false, message: "Question not found" });
  }

  const submission = await SubmissionModel.create({
    userId: user.id,
    questionId: question.id,
    code: payload.code,
    trialCount: payload.trial_count,
    timeMinutes: payload.time_minutes,
    language: payload.language,
    status: "pending"
  });

  await addSubmissionJob(submission.id);

  return res.json({
    submission_id: submission.id,
    status: submission.status
  });
}

submissionsRouter.post("/leetcode", requireAuth, async (req, res, next) => {
  try {
    await handleSubmission(req, res, "leetcode");
  } catch (error) {
    next(error);
  }
});

submissionsRouter.post("/codeforces", requireAuth, async (req, res, next) => {
  try {
    await handleSubmission(req, res, "codeforces");
  } catch (error) {
    next(error);
  }
});

submissionsRouter.get("/history", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const submissions = await SubmissionModel.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("questionId");

    const results = submissions.map((item) => {
      const question = item.questionId as any;
      return {
        id: item.id,
        question_key: question?.questionKey,
        platform: question?.platform,
        title: question?.title,
        status: item.status,
        trial_count: item.trialCount,
        time_minutes: item.timeMinutes,
        github_commit_url: item.githubCommitUrl
      };
    });

    return res.json({ submissions: results });
  } catch (error) {
    next(error);
  }
});

submissionsRouter.get("/:id/status", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const submission = await SubmissionModel.findOne({ _id: req.params.id, userId: req.userId });
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }
    return res.json({
      id: submission.id,
      status: submission.status,
      error: submission.errorMessage
    });
  } catch (error) {
    next(error);
  }
});
