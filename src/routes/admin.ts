import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/admin.js";
import { GroupSheetModel } from "../models/GroupSheet.js";
import { QuestionModel } from "../models/Question.js";
import { QuestionGroupMappingModel } from "../models/QuestionGroupMapping.js";

export const adminRouter = Router();

const groupSchema = z.object({
  group_name: z.string().min(2),
  sheet_id: z.string().min(5),
  name_column: z.string().min(1),
  name_start_row: z.coerce.number().int().min(1),
  name_end_row: z.coerce.number().int().min(1),
  active: z.boolean().optional()
});

const questionSchema = z.object({
  platform: z.enum(["leetcode", "codeforces"]),
  question_key: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url()
});

const mappingSchema = z.object({
  question_id: z.string().min(1),
  group_id: z.string().min(1),
  trial_column: z.string().min(1),
  time_column: z.string().min(1)
});

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

adminRouter.get("/questions", requireAdmin, async (_req, res, next) => {
  try {
    const questions = await QuestionModel.find().sort({ platform: 1, questionKey: 1 });
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
