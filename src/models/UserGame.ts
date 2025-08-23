import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserGame extends Document {
    userId: Types.ObjectId;
    gameId: Types.ObjectId;
    status: "owned" | "wishlist" | "playing" | "completed" | "abandoned";
}

const UserGameSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
        status: {
            type: String,
            enum: ["owned", "wishlist", "playing", "completed", "abandoned"],
            required: true
        }
    },
    { timestamps: true }
);

export const UserGameModel = mongoose.model<IUserGame>(
    "UserGame",
    UserGameSchema
);
