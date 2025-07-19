//User.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  gamesOwned: {
    gameId: mongoose.Schema.Types.ObjectId;  // Reference to the Game document
    status: "not started" | "in progress" | "completed";
  }[];
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  gamesOwned: [
    {
      gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
      status: {
        type: String,
        enum: ["not started", "in progress", "completed"],
        default: "not started"
      }
    }
  ]
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);
