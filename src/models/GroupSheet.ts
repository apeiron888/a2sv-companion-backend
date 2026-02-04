import mongoose, { Schema } from "mongoose";

const GroupSheetSchema = new Schema(
  {
    groupName: { type: String, required: true, unique: true },
    sheetId: { type: String, required: true },
    nameColumn: { type: String, required: true },
    nameStartRow: { type: Number, required: true },
    nameEndRow: { type: Number, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const GroupSheetModel = mongoose.model("GroupSheet", GroupSheetSchema);
