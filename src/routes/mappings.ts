import { Router } from "express";
import { ProblemMappingModel } from "../models/problemMapping.js";
import { requireManager } from "../middleware/auth.js";

const router = Router();

router.get("/mappings", requireManager, (_req, res) => {
  const managerId = _req.auth?.userId as string;
  const sheetConfigId = _req.query.sheetConfigId as string | undefined;
  const query: Record<string, string> = { managerId };
  if (sheetConfigId) query.sheetConfigId = sheetConfigId;
  ProblemMappingModel.find(query)
    .then((mappings) => res.json(mappings))
    .catch((err) => res.status(500).json({ error: err.message }));
});

router.get("/mappings/lookup", (_req, res) => {
  const problemUrl = _req.query.problemUrl as string | undefined;
  if (!problemUrl) return res.status(400).json({ error: "Missing problemUrl" });
  ProblemMappingModel.findOne({ problemUrl })
    .then((mapping) => {
      if (!mapping) return res.status(404).json({ error: "Mapping not found" });
      return res.json(mapping);
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

router.post("/mappings", requireManager, (_req, res) => {
  const managerId = _req.auth?.userId as string;
  const payload = { ..._req.body, managerId };
  ProblemMappingModel.create(payload)
    .then((mapping) => res.status(201).json(mapping))
    .catch((err) => res.status(500).json({ error: err.message }));
});

router.patch("/mappings/:id", requireManager, (_req, res) => {
  const managerId = _req.auth?.userId as string;
  ProblemMappingModel.findOneAndUpdate({ _id: _req.params.id, managerId }, _req.body, { new: true })
    .then((mapping) => res.json(mapping))
    .catch((err) => res.status(500).json({ error: err.message }));
});

router.delete("/mappings/:id", requireManager, (_req, res) => {
  const managerId = _req.auth?.userId as string;
  ProblemMappingModel.findOneAndDelete({ _id: _req.params.id, managerId })
    .then(() => res.status(204).send())
    .catch((err) => res.status(500).json({ error: err.message }));
});

export default router;
