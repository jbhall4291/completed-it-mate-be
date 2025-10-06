//gameRoutes.ts
import express from "express";
import { getGames, getGameDetail } from "../controllers/gameController";

const router = express.Router();

// Route: GET /api/games
router.get("/games", getGames);
router.get('/games/:idOrSlug', getGameDetail);

export default router;