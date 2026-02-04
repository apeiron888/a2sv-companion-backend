import mongoose, { Schema } from "mongoose";

const QuestionGroupMappingSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "GroupSheet", required: true },
    trialColumn: { type: String, required: true },
    timeColumn: { type: String, required: true }
  },
  { timestamps: true }
);

QuestionGroupMappingSchema.index({ questionId: 1, groupId: 1 }, { unique: true });

export const QuestionGroupMappingModel = mongoose.model(
  "QuestionGroupMapping",
  QuestionGroupMappingSchema
);
