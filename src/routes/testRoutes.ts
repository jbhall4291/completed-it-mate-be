import express from 'express';
import { resetTestUserLibrary } from "../controllers/testController";

const router = express.Router();

router.delete('/test/reset-library', resetTestUserLibrary);

export default router;
