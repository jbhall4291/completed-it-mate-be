//validators.ts
import mongoose from "mongoose";

// validate a mongoDB/Mongoose ID
export function validateObjectId(id: string, label: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: `Invalid ${label} Id` };
  }
}