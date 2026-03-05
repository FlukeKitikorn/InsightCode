import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  adminLogin,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/admin-login", adminLogin);
router.post("/refresh", refresh);
router.post("/logout", logout);

// Protected route
router.get("/me", authenticate, getMe);

export default router;
