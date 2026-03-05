import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createSubmission,
  listSubmissions,
  runSubmission,
  internalJudgeSubmission,
  getSubmission,
  deleteSubmission,
} from "../controllers/submission.controller.js";

const router = Router();

router.post("/internal/judge", internalJudgeSubmission);
router.get("/", authenticate, listSubmissions);
router.get("/:id", authenticate, getSubmission);
router.delete("/:id", authenticate, deleteSubmission);
router.post("/run", authenticate, runSubmission);
router.post("/", authenticate, createSubmission);

export default router;

