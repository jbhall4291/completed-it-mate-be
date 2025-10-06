//gameRoutes.ts
import express from "express";
import { getGames, getGameDetail, getTopRatedGames, getLatestReleases } from "../controllers/gameController";

const router = express.Router();

// Route: GET /api/games
router.get("/games", getGames);
router.get("/games/top", getTopRatedGames);
router.get("/games/latest", getLatestReleases);
router.get('/games/:idOrSlug', getGameDetail);

export default router;