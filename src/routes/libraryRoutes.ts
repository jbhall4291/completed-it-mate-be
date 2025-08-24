import { Router } from "express";
import { addToLibrary, listLibrary, removeFromLibrary } from "../controllers/libraryController";
import { checkApiKey } from "../middleware/checkApiKey";

const router = Router();

router.post("/library", checkApiKey, addToLibrary);  // POST /api/library
router.get("/library", checkApiKey, listLibrary);    // GET  /api/library?userId=...
router.delete("/library/:userGameId", checkApiKey, removeFromLibrary);    // DELETE  /api/library/:userGameId

export default router;
