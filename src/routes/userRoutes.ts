//userRoutes.ts
import express from "express";
import { getUsers, createUser, getUserById, addGameToUser } from "../controllers/userController";

const router = express.Router();

// Route: GET /api/users
router.get("/users", getUsers);

router.get("/users/:id", getUserById);

// Route: POST /api/users
router.post("/users", createUser);

router.post("/users/:id/games", addGameToUser)

export default router;
