import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { listProblems, getProblem } from "../controllers/problem.controller.js";

const router = Router();

router.get("/", authenticate, listProblems);
router.get("/:id", getProblem);

export default router;

