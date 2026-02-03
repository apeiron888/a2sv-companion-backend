import mongoose, { Schema } from "mongoose";

export interface ProblemMappingDoc {
  managerId: string;
  sheetConfigId: string;
  platform: "leetcode" | "codeforces";
  problemUrl: string;
  solutionColumn: string;
  timeColumn: string;
  trialsColumn?: string;
}

const problemMappingSchema = new Schema<ProblemMappingDoc>(
  {
    managerId: { type: String, required: true, index: true },
    sheetConfigId: { type: String, required: true, index: true },
    platform: { type: String, required: true, enum: ["leetcode", "codeforces"] },
    problemUrl: { type: String, required: true },
    solutionColumn: { type: String, required: true },
    timeColumn: { type: String, required: true },
    trialsColumn: String
  },
  { timestamps: true }
);

export const ProblemMappingModel = mongoose.model<ProblemMappingDoc>("ProblemMapping", problemMappingSchema);
