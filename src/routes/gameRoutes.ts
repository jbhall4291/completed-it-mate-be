//gameRoutes.ts
import express from "express";
import { getGames } from "../controllers/gameController";

const router = express.Router();

// Route: GET /api/games
router.get("/games", getGames);

export default router;