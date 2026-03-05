import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  getAdminStats,
  getAdminLogs,
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  listAdminProblems,
  getAdminProblem,
  createAdminProblem,
  updateAdminProblem,
  deleteAdminProblem,
  importAdminProblems,
  listAdminSubmissions,
  listAdminAiInsights,
} from "../controllers/admin.controller.js";
import {
  createAnnouncement,
  listAdminAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcement.controller.js";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/stats", getAdminStats);
router.get("/logs", getAdminLogs);
router.get("/users", listAdminUsers);
router.post("/users", createAdminUser);
router.patch("/users/:id", updateAdminUser);
router.delete("/users/:id", deleteAdminUser);
router.get("/problems", listAdminProblems);
router.get("/problems/:id", getAdminProblem);
router.post("/problems", createAdminProblem);
router.patch("/problems/:id", updateAdminProblem);
router.delete("/problems/:id", deleteAdminProblem);
router.post("/problems/import", importAdminProblems);
router.get("/submissions", listAdminSubmissions);
router.get("/ai-feedback", listAdminAiInsights);

// Admin CRUD for announcements
router.get("/announcements", listAdminAnnouncements);
router.post("/announcements", createAnnouncement);
router.patch("/announcements/:id", updateAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

export default router;

