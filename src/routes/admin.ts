import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/admin.js";
import { GroupSheetModel } from "../models/GroupSheet.js";
import { QuestionModel } from "../models/Question.js";
import { QuestionGroupMappingModel } from "../models/QuestionGroupMapping.js";
import { PhaseModel } from "../models/Phase.js";
import { addQuestionToMasterSheet, getNextAvailableColumn } from "../services/masterSheetService.js";

export const adminRouter = Router();

// ─── Phase Schemas ────────────────────────────────────────────────

const phaseSchema = z.object({
  name: z.string().min(2),
  tab_name: z.string().min(1),
  master_sheet_id: z.string().min(5),
  start_column: z.string().min(1).default("H"),
  order: z.coerce.number().int().min(0).default(0),
  active: z.boolean().optional()
});

// ─── Group Schemas ────────────────────────────────────────────────

const groupSchema = z.object({
  group_name: z.string().min(2),
  sheet_id: z.string().min(5),
  name_column: z.string().min(1),
  name_start_row: z.coerce.number().int().min(1),
  name_end_row: z.coerce.number().int().min(1),
  active: z.boolean().optional()
});

// ─── Question Schemas ─────────────────────────────────────────────

const questionSchema = z.object({
  platform: z.enum(["leetcode", "codeforces", "hackerrank"]),
  question_key: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url()
});

const addToSheetSchema = z.object({
  phase_id: z.string().min(1),
  platform: z.enum(["leetcode", "codeforces", "hackerrank"]),
  question_key: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  tags: z.array(z.string()).default([])
});

// ─── Mapping Schemas ──────────────────────────────────────────────

const mappingSchema = z.object({
  question_id: z.string().min(1),
  group_id: z.string().min(1),
  trial_column: z.string().min(1),
  time_column: z.string().min(1)
});

// ═══════════════════════════════════════════════════════════════════
//  PHASE ROUTES
// ═══════════════════════════════════════════════════════════════════

adminRouter.post("/phases", requireAdmin, async (req, res, next) => {
  try {
    const payload = phaseSchema.parse(req.body);
    const phase = await PhaseModel.create({
      name: payload.name,
      tabName: payload.tab_name,
      masterSheetId: payload.master_sheet_id,
      startColumn: payload.start_column,
      order: payload.order,
      active: payload.active ?? true
    });
    return res.json({ id: phase.id });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/phases", requireAdmin, async (_req, res, next) => {
  try {
    const phases = await PhaseModel.find().sort({ order: 1 });

    // Enrich with question count per phase
    const enriched = await Promise.all(
      phases.map(async (phase) => {
        const questionCount = await QuestionModel.countDocuments({ phaseId: phase._id });
        return {
          ...phase.toJSON(),
          questionCount
        };
      })
    );

    return res.json({ phases: enriched });
  } catch (error) {
    return next(error);
  }
});

adminRouter.put("/phases/:id", requireAdmin, async (req, res, next) => {
  try {
    const payload = phaseSchema.partial().parse(req.body);
    const phase = await PhaseModel.findByIdAndUpdate(
      req.params.id,
      {
        ...(payload.name && { name: payload.name }),
        ...(payload.tab_name && { tabName: payload.tab_name }),
        ...(payload.master_sheet_id && { masterSheetId: payload.master_sheet_id }),
        ...(payload.start_column && { startColumn: payload.start_column }),
        ...(payload.order !== undefined && { order: payload.order }),
        ...(payload.active !== undefined && { active: payload.active })
      },
      { new: true }
    );
    if (!phase) {
      return res.status(404).json({ success: false, message: "Phase not found" });
    }
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/phases/:id", requireAdmin, async (req, res, next) => {
  try {
    await PhaseModel.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

// ═══════════════════════════════════════════════════════════════════
//  GROUP ROUTES
// ═══════════════════════════════════════════════════════════════════

adminRouter.post("/groups", requireAdmin, async (req, res, next) => {
  try {
    const payload = groupSchema.parse(req.body);
    const group = await GroupSheetModel.create({
      groupName: payload.group_name,
      sheetId: payload.sheet_id,
      nameColumn: payload.name_column,
      nameStartRow: payload.name_start_row,
      nameEndRow: payload.name_end_row,
      active: payload.active ?? true
    });
    return res.json({ id: group.id });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/groups", requireAdmin, async (_req, res, next) => {
  try {
    const groups = await GroupSheetModel.find().sort({ groupName: 1 });
    return res.json({ groups });
  } catch (error) {
    return next(error);
  }
});

adminRouter.put("/groups/:id", requireAdmin, async (req, res, next) => {
  try {
    const payload = groupSchema.partial().parse(req.body);
    const group = await GroupSheetModel.findByIdAndUpdate(
      req.params.id,
      {
        ...(payload.group_name && { groupName: payload.group_name }),
        ...(payload.sheet_id && { sheetId: payload.sheet_id }),
        ...(payload.name_column && { nameColumn: payload.name_column }),
        ...(payload.name_start_row && { nameStartRow: payload.name_start_row }),
        ...(payload.name_end_row && { nameEndRow: payload.name_end_row }),
        ...(payload.active !== undefined && { active: payload.active })
      },
      { new: true }
    );
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/groups/:id", requireAdmin, async (req, res, next) => {
  try {
    await GroupSheetModel.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

// ═══════════════════════════════════════════════════════════════════
//  QUESTION ROUTES
// ═══════════════════════════════════════════════════════════════════

adminRouter.post("/questions", requireAdmin, async (req, res, next) => {
  try {
    const payload = questionSchema.parse(req.body);
    const question = await QuestionModel.create({
      platform: payload.platform,
      questionKey: payload.question_key,
      title: payload.title,
      url: payload.url
    });
    return res.json({ id: question.id });
  } catch (error) {
    return next(error);
  }
});

/**
 * Add question to DB AND write it to the Master Sheet with formatting.
 * This also auto-creates QuestionGroupMappings for all active groups.
 */
adminRouter.post("/questions/add-to-sheet", requireAdmin, async (req, res, next) => {
  try {
    const payload = addToSheetSchema.parse(req.body);
    const result = await addQuestionToMasterSheet({
      phaseId: payload.phase_id,
      platform: payload.platform,
      questionKey: payload.question_key,
      title: payload.title,
      url: payload.url,
      difficulty: payload.difficulty,
      tags: payload.tags
    });

    return res.json({
      question_id: result.questionId,
      master_column: result.masterColumn,
      time_column: result.timeColumn,
      mappings_created: result.mappingsCreated,
      sheet_updated: result.sheetUpdated
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * Preview next available column for a phase.
 */
adminRouter.get("/questions/next-column/:phaseId", requireAdmin, async (req, res, next) => {
  try {
    const result = await getNextAvailableColumn(req.params.phaseId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/questions", requireAdmin, async (req, res, next) => {
  try {
    const filter: any = {};
    if (req.query.phase_id) {
      filter.phaseId = req.query.phase_id;
    }
    const questions = await QuestionModel.find(filter).sort({ createdAt: -1 }).populate("phaseId");
    return res.json({ questions });
  } catch (error) {
    return next(error);
  }
});

adminRouter.put("/questions/:id", requireAdmin, async (req, res, next) => {
  try {
    const payload = questionSchema.partial().parse(req.body);
    const question = await QuestionModel.findByIdAndUpdate(
      req.params.id,
      {
        ...(payload.platform && { platform: payload.platform }),
        ...(payload.question_key && { questionKey: payload.question_key }),
        ...(payload.title && { title: payload.title }),
        ...(payload.url && { url: payload.url })
      },
      { new: true }
    );
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/questions/:id", requireAdmin, async (req, res, next) => {
  try {
    await QuestionModel.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

// ═══════════════════════════════════════════════════════════════════
//  MAPPING ROUTES
// ═══════════════════════════════════════════════════════════════════

adminRouter.post("/mappings", requireAdmin, async (req, res, next) => {
  try {
    const payload = mappingSchema.parse(req.body);
    const mapping = await QuestionGroupMappingModel.create({
      questionId: payload.question_id,
      groupId: payload.group_id,
      trialColumn: payload.trial_column,
      timeColumn: payload.time_column
    });
    return res.json({ id: mapping.id });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/mappings", requireAdmin, async (_req, res, next) => {
  try {
    const mappings = await QuestionGroupMappingModel.find().sort({ createdAt: -1 });
    return res.json({ mappings });
  } catch (error) {
    return next(error);
  }
});

adminRouter.put("/mappings/:id", requireAdmin, async (req, res, next) => {
  try {
    const payload = mappingSchema.partial().parse(req.body);
    const mapping = await QuestionGroupMappingModel.findByIdAndUpdate(
      req.params.id,
      {
        ...(payload.question_id && { questionId: payload.question_id }),
        ...(payload.group_id && { groupId: payload.group_id }),
        ...(payload.trial_column && { trialColumn: payload.trial_column }),
        ...(payload.time_column && { timeColumn: payload.time_column })
      },
      { new: true }
    );
    if (!mapping) {
      return res.status(404).json({ success: false, message: "Mapping not found" });
    }
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/mappings/:id", requireAdmin, async (req, res, next) => {
  try {
    await QuestionGroupMappingModel.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});
