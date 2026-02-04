import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAuthToken(userId: string) {
  const secret = env.JWT_SECRET as jwt.Secret;
  const expiresIn = env.JWT_EXPIRES_IN as unknown as jwt.SignOptions["expiresIn"];
  return jwt.sign({ sub: userId }, secret, { expiresIn });
}

export function signTempToken(userId: string) {
  const secret = env.JWT_SECRET as jwt.Secret;
  const expiresIn = "15m" as unknown as jwt.SignOptions["expiresIn"];
  return jwt.sign({ sub: userId, purpose: "github_oauth" }, secret, { expiresIn });
}

export function verifyTempToken(token: string) {
  const payload = jwt.verify(token, env.JWT_SECRET as jwt.Secret) as { sub: string; purpose: string };
  if (payload.purpose !== "github_oauth") {
    throw new Error("Invalid state token");
  }
  return payload.sub;
}
