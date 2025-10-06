// controllers/userController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { UserModel } from "../models/User";
import {
  addUserService,
  getUserByIdService,
  getOrCreateAnonByDeviceId,
  updateUsernameService,
  toSafeUser,
} from "../services/userService";

// GET /api/users
export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await UserModel.find().populate("gameCount").exec();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

// GET /api/users/:id
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await getUserByIdService(id);
    res.json(user);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Error getting user" });
  }
};

// POST /api/users
export const createUser = async (req: Request, res: Response) => {
  const { username, email } = req.body as { username?: string; email?: string };
  try {
    const created = await addUserService(username!, email!);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message || "Error creating user" });
  }
};

// POST /api/users/anonymous
export const postAnonymousUser = async (req: Request, res: Response) => {
  const { deviceId } = req.body as { deviceId?: string };
  if (!deviceId) return res.status(400).json({ message: "deviceId is required" });

  try {
    const user = await getOrCreateAnonByDeviceId(deviceId);
    return res.status(200).json(toSafeUser(user));
  } catch (error: any) {
    console.error("anon error:", error); // 👈 log it
    // optional: expose the reason during dev
    return res.status(500).json({ message: error?.message || "Error creating anon user" });
  }
};


// Helper: read X-User-Id
function requireUserIdHeader(req: Request, res: Response): string | null {
  const id = req.header("x-user-id");
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return id;
}

// GET /api/users/me
export const getMe = async (req: Request, res: Response) => {
  const userId = requireUserIdHeader(req, res);
  if (!userId) return;

  try {
    const user = await UserModel.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(toSafeUser(user));
  } catch {
    return res.status(500).json({ message: "Error fetching user" });
  }
};

// PATCH /api/users/me
export const patchMe = async (req: Request, res: Response) => {
  const userId = requireUserIdHeader(req, res);
  if (!userId) return;

  const { username } = req.body as { username?: string };
  if (!username) return res.status(400).json({ message: "username is required" });

  try {
    const user = await updateUsernameService(userId, username);
    return res.json(toSafeUser(user));
  } catch (error: any) {
    // unique username violation
    if (error?.code === 11000 || /duplicate key/i.test(String(error?.message))) {
      return res.status(409).json({ message: "username already taken" });
    }
    console.error(error);
    return res
      .status(error?.status || 400)
      .json({ message: error?.message || "Error updating username" });
  }
};
