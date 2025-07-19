//userRoutes.ts
import express from "express";
import { getUsers } from "../controllers/userController";

const router = express.Router();

// Route: GET /api/users
router.get("/users", getUsers);

export default router;
