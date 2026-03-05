import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getProfile,
  updateProfile,
  getProgress,
  getMyInsights,
  getMyAnnouncements,
  markMyAnnouncementsRead,
} from "../controllers/user.controller.js";
import { postChat } from "../controllers/chat.controller.js";

const router = Router();

router.get("/me", authenticate, getProfile);
router.put("/me", authenticate, updateProfile);
router.get("/me/progress", authenticate, getProgress);
router.get("/me/insights", authenticate, getMyInsights);
router.get("/me/announcements", authenticate, getMyAnnouncements);
router.post("/me/announcements/read", authenticate, markMyAnnouncementsRead);
router.post("/me/chat", authenticate, postChat);

export default router;

