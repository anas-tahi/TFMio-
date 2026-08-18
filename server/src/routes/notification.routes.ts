import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";

const router = Router();

router.get("/", authenticate, getMyNotifications);
router.patch("/:id/read", authenticate, markAsRead);
router.patch("/read-all", authenticate, markAllAsRead);

export default router;