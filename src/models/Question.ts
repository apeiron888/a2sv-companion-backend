import mongoose, { Schema } from "mongoose";

const QuestionSchema = new Schema(
  {
    platform: { type: String, required: true, enum: ["leetcode", "codeforces"] },
    questionKey: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true }
  },
  { timestamps: true }
);

QuestionSchema.index({ platform: 1, questionKey: 1 }, { unique: true });

export const QuestionModel = mongoose.model("Question", QuestionSchema);
