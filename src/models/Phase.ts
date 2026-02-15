import mongoose, { Schema } from "mongoose";

const PhaseSchema = new Schema(
  {
<<<<<<< HEAD
    name: { type: String, required: true, unique: true },
    tabName: { type: String, required: true },
    masterSheetId: { type: String, required: true },
    startColumn: { type: String, required: true, default: "H" },
    lastQuestionColumn: { type: String, default: null },
    order: { type: Number, required: true, default: 0 },
=======
    name: { type: String, required: true },
    tabName: { type: String, required: true },
    masterSheetId: { type: String, required: true },
    startColumn: { type: String, required: true, default: "E" },
    lastQuestionColumn: { type: String, default: null },
    order: { type: Number, default: 0 },
>>>>>>> 8c60849 (feat: implement master sheet synchronization functionality with new endpoints and UI components)
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

<<<<<<< HEAD
=======
PhaseSchema.index({ masterSheetId: 1, tabName: 1 }, { unique: true });

>>>>>>> 8c60849 (feat: implement master sheet synchronization functionality with new endpoints and UI components)
export const PhaseModel = mongoose.model("Phase", PhaseSchema);
