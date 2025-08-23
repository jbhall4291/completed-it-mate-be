//User.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  gamesOwned: Game[];
}

type Game = {
  gameId: Types.ObjectId;  // Reference to the Game document
  status: "not started" | "in progress" | "completed" | "unknown";
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  gamesOwned: [
    {
      gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
      status: {
        type: String,
        enum: ["not started", "in progress", "completed", "unknown"],
        default: "not started"
      }
    }
  ]
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);