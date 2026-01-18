//communityRoutes.ts
import express from "express";
import { getCommunityDashboard } from "../controllers/communityController";

const router = express.Router();

router.get("/community/dashboard", getCommunityDashboard);

export default router;