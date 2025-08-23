import { Router } from "express";
import { addToLibrary, listLibrary } from "../controllers/libraryController";
import { checkApiKey } from "../middleware/checkApiKey";

const router = Router();

router.post("/library", checkApiKey, addToLibrary);  // POST /api/library
router.get("/library", checkApiKey, listLibrary);    // GET  /api/library?userId=...

export default router;
