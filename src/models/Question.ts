import mongoose, { Schema } from "mongoose";

const QuestionSchema = new Schema(
  {
    platform: { type: String, required: true, enum: ["leetcode", "codeforces", "hackerrank"] },
    questionKey: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
    tags: { type: [String], default: [] },
    phaseId: { type: Schema.Types.ObjectId, ref: "Phase" },
    masterColumn: { type: String },
    timeColumn: { type: String }
  },
  { timestamps: true }
);

QuestionSchema.index({ platform: 1, questionKey: 1 }, { unique: true });

export const QuestionModel = mongoose.model("Question", QuestionSchema);
