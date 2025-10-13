//gameRoutes.ts
import express from "express";
import { getGames, getGameFacets, getGameDetail, getTopRatedGames, getLatestReleases } from "../controllers/gameController";
import { GameModel } from "../models/Game";

const router = express.Router();

router.get("/games/facets", getGameFacets);
// Route: GET /api/games
router.get("/games", getGames);
router.get("/games/top", getTopRatedGames);
router.get("/games/latest", getLatestReleases);
router.get('/games/:idOrSlug', getGameDetail);


export default router;