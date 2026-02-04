import mongoose, { Schema } from "mongoose";

const SubmissionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    code: { type: String, required: true },
    trialCount: { type: Number, required: true },
    timeMinutes: { type: Number, required: true },
    language: { type: String, required: true },
    githubCommitUrl: { type: String },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending"
    },
    sheetUpdated: { type: Boolean, default: false },
    errorMessage: { type: String }
  },
  { timestamps: true }
);

export const SubmissionModel = mongoose.model("Submission", SubmissionSchema);
