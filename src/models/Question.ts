import mongoose, { Schema } from "mongoose";

const QuestionSchema = new Schema(
  {
<<<<<<< HEAD
    platform: { type: String, required: true, enum: ["leetcode", "codeforces", "hackerrank"] },
    questionKey: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
    tags: { type: [String], default: [] },
    phaseId: { type: Schema.Types.ObjectId, ref: "Phase" },
    masterColumn: { type: String },
    timeColumn: { type: String }
=======
    platform: {
      type: String,
      required: true,
      enum: ["leetcode", "codeforces", "hackerrank", "atcoder", "geeksforgeeks"]
    },
    questionKey: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: null },
    tags: { type: [String], default: [] },
    phaseId: { type: Schema.Types.ObjectId, ref: "Phase", default: null },
    masterColumn: { type: String, default: null },
    timeColumn: { type: String, default: null }
>>>>>>> 8c60849 (feat: implement master sheet synchronization functionality with new endpoints and UI components)
  },
  { timestamps: true }
);

QuestionSchema.index({ platform: 1, questionKey: 1 }, { unique: true });

export const QuestionModel = mongoose.model("Question", QuestionSchema);
