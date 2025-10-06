//userRoutes.ts
import express from "express";
import {
    getUsers,
    createUser,
    getUserById,
    postAnonymousUser,
    getMe,
    patchMe
} from "../controllers/userController";

const router = express.Router();

router.get("/users", getUsers);

router.post("/users/anonymous", postAnonymousUser);
router.get("/users/me", getMe);
router.patch("/users/me", patchMe);

router.post("/users", createUser);
router.get("/users/:id", getUserById);

export default router;
