import mongoose, { Schema } from "mongoose";

const ExtensionInstallSchema = new Schema(
  {
    installId: { type: String, required: true, unique: true },
    keyHash: { type: String, required: true, unique: true },
    extensionVersion: { type: String },
    userAgent: { type: String },
    revokedAt: { type: Date },
    lastSeenAt: { type: Date }
  },
  { timestamps: true }
);

export const ExtensionInstallModel = mongoose.model("ExtensionInstall", ExtensionInstallSchema);
