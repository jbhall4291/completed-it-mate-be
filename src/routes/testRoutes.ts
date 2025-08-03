import express from 'express';
import { resetTestUserLibrary } from "../controllers/testController";

const router = express.Router();

router.post('/test/reset-library', resetTestUserLibrary);

export default router;
