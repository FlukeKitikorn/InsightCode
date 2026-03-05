import { Router } from "express";
import { listAnnouncements } from "../controllers/announcement.controller.js";

const router = Router();

// Public for now – theseเป็นประกาศทั่วไปจาก admin
router.get("/", listAnnouncements);

export default router;

