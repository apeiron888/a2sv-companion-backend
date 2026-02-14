import mongoose, { Schema } from "mongoose";

const PhaseSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    tabName: { type: String, required: true },
    masterSheetId: { type: String, required: true },
    startColumn: { type: String, required: true, default: "H" },
    lastQuestionColumn: { type: String, default: null },
    order: { type: Number, required: true, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const PhaseModel = mongoose.model("Phase", PhaseSchema);
