import { Router } from "express";
import health from "./health.js";
import auth from "./auth.js";
import users from "./users.js";
import github from "./github.js";
import sheets from "./sheets.js";
import mappings from "./mappings.js";
import submissions from "./submissions.js";
import { requireAuth, requireManager } from "../middleware/auth.js";

const router = Router();

router.use(health);
router.use(auth);
router.use(requireAuth, users);
router.use(requireAuth, github);
router.use(requireAuth, requireManager, sheets);
router.use(requireAuth, mappings);
router.use(requireAuth, submissions);

export default router;
