import mongoose, { Schema } from "mongoose";

export interface RepoConfigDoc {
  userId: string;
  repoOwner: string;
  repoName: string;
  defaultBranch?: string;
  folderPath?: string;
}

const repoConfigSchema = new Schema<RepoConfigDoc>(
  {
    userId: { type: String, required: true, index: true },
    repoOwner: { type: String, required: true },
    repoName: { type: String, required: true },
    defaultBranch: String,
    folderPath: String
  },
  { timestamps: true }
);

export const RepoConfigModel = mongoose.model<RepoConfigDoc>("RepoConfig", repoConfigSchema);
