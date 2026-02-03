import { Router } from "express";
import { SubmissionModel } from "../models/submission.js";
import { z } from "zod";
import { createSubmission, processSubmission } from "../services/submissionService.js";

const submissionSchema = z.object({
  platform: z.enum(["leetcode", "codeforces"]),
  problemUrl: z.string().url(),
  language: z.string().min(1),
  trials: z.number().int().min(1),
  timeMinutes: z.number().min(0),
  code: z.string().min(1)
});

const router = Router();

router.post("/submissions", (_req, res) => {
  const userId = _req.auth?.userId as string;
  const parse = submissionSchema.safeParse(_req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid submission", details: parse.error.flatten() });
  }

  createSubmission({ ...parse.data, userId })
    .then(async (submission) => {
      processSubmission(String(submission._id)).catch(() => null);
      return res.status(201).json(submission);
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

router.get("/submissions/:id", (_req, res) => {
  const userId = _req.auth?.userId as string;
  SubmissionModel.findOne({ _id: _req.params.id, userId })
    .then((submission) => {
      if (!submission) return res.status(404).json({ error: "Submission not found" });
      return res.json(submission);
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

export default router;
