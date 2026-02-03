import mongoose, { Schema } from "mongoose";

export interface SheetConfigDoc {
  managerId: string;
  sheetId: string;
  sheetName: string;
  rowKeyColumn?: string;
  rowKeyValue?: string;
}

const sheetConfigSchema = new Schema<SheetConfigDoc>(
  {
    managerId: { type: String, required: true, index: true },
    sheetId: { type: String, required: true },
    sheetName: { type: String, required: true },
    rowKeyColumn: String,
    rowKeyValue: String
  },
  { timestamps: true }
);

export const SheetConfigModel = mongoose.model<SheetConfigDoc>("SheetConfig", sheetConfigSchema);
