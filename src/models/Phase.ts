import mongoose, { Schema } from "mongoose";

const PhaseSchema = new Schema(
  {
    name: { type: String, required: true },
    tabName: { type: String, required: true },
    masterSheetId: { type: String, required: true },
    startColumn: { type: String, required: true, default: "E" },
    lastQuestionColumn: { type: String, default: null },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

PhaseSchema.index({ masterSheetId: 1, tabName: 1 }, { unique: true });
export const PhaseModel = mongoose.model("Phase", PhaseSchema);
