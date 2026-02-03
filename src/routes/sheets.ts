import { Router } from "express";
import { SheetConfigModel } from "../models/sheetConfig.js";

const router = Router();

router.get("/sheets", (_req, res) => {
  const managerId = _req.auth?.userId as string;
  SheetConfigModel.find({ managerId })
    .then((sheets) => res.json(sheets))
    .catch((err) => res.status(500).json({ error: err.message }));
});

router.post("/sheets/validate", (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
});

router.post("/sheets/config", (_req, res) => {
  const managerId = _req.auth?.userId as string;
  const payload = { ..._req.body, managerId };
  SheetConfigModel.create(payload)
    .then((sheet) => res.status(201).json(sheet))
    .catch((err) => res.status(500).json({ error: err.message }));
});

export default router;
