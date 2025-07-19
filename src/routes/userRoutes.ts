//userRoutes.ts
import express from "express";
import { getUsers, createUser } from "../controllers/userController";

const router = express.Router();

// Route: GET /api/users
router.get("/users", getUsers);

// Route: POST /api/users
router.post("/users", createUser);

export default router;
