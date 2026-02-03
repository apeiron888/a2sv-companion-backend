import { Router } from "express";
import { UserModel } from "../models/user.js";

const router = Router();

router.get("/users/me", (_req, res) => {
  const userId = _req.auth?.userId as string;
  UserModel.findById(userId)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

router.patch("/users/me", (_req, res) => {
  const userId = _req.auth?.userId as string;
  const update = _req.body || {};
  UserModel.findByIdAndUpdate(userId, update, { new: true, upsert: true })
    .then((user) => res.json(user))
    .catch((err) => res.status(500).json({ error: err.message }));
});

export default router;
