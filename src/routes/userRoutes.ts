//userRoutes.ts
import express from "express";
import { getUsers, createUser, getUserById } from "../controllers/userController";

const router = express.Router();

// Route: GET /api/users
router.get("/users", getUsers);

router.get("/users/:id", getUserById);

// Route: POST /api/users
router.post("/users", createUser);

export default router;
