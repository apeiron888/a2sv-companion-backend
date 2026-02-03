import mongoose, { Schema } from "mongoose";

export interface SubmissionDoc {
  userId: string;
  platform: "leetcode" | "codeforces";
  problemUrl: string;
  language: string;
  trials: number;
  timeMinutes: number;
  code: string;
  codeHash: string;
  githubCommitUrl?: string;
  status: "pending" | "committed" | "sheet_updated" | "failed";
  errorMessage?: string;
}

const submissionSchema = new Schema<SubmissionDoc>(
  {
    userId: { type: String, required: true, index: true },
    platform: { type: String, required: true, enum: ["leetcode", "codeforces"] },
    problemUrl: { type: String, required: true },
    language: { type: String, required: true },
    trials: { type: Number, required: true },
    timeMinutes: { type: Number, required: true },
    code: { type: String, required: true },
    codeHash: { type: String, required: true },
    githubCommitUrl: String,
    status: {
      type: String,
      required: true,
      enum: ["pending", "committed", "sheet_updated", "failed"],
      default: "pending"
    },
    errorMessage: String
  },
  { timestamps: true }
);

export const SubmissionModel = mongoose.model<SubmissionDoc>("Submission", submissionSchema);
