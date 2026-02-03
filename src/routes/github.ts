import { Router } from "express";
import { RepoConfigModel } from "../models/repoConfig.js";
import { OAuthTokenModel } from "../models/oauthToken.js";

const router = Router();

router.get("/github/repos", (_req, res) => {
  const userId = _req.auth?.userId as string;
  OAuthTokenModel.findOne({ userId, provider: "github" })
    .then(async (token) => {
      if (!token) return res.status(401).json({ error: "GitHub token missing" });

      const resp = await fetch("https://api.github.com/user/repos?per_page=100", {
        headers: { Authorization: `Bearer ${token.accessToken}`, Accept: "application/vnd.github+json" }
      });
      if (!resp.ok) {
        return res.status(502).json({ error: "Failed to fetch repos" });
      }
      const data = (await resp.json()) as Array<{ full_name: string; private: boolean; default_branch: string }>;
      const repos = data.map((repo) => ({
        fullName: repo.full_name,
        isPrivate: repo.private,
        defaultBranch: repo.default_branch
      }));

      return res.json(repos);
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

router.post("/github/repo-config", (_req, res) => {
  const userId = _req.auth?.userId as string;
  const payload = { ..._req.body, userId };
  RepoConfigModel.findOneAndUpdate({ userId }, payload, { new: true, upsert: true })
    .then((repoConfig) => res.json(repoConfig))
    .catch((err) => res.status(500).json({ error: err.message }));
});

export default router;
