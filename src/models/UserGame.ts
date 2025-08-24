// UserGame.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { allowedStatuses, GameStatus } from "../constants/gameStatus";

export interface IUserGame extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    gameId: Types.ObjectId;
    status: GameStatus;
}

const UserGameSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
        status: {
            type: String,
            enum: allowedStatuses,
            required: true
        }
    },
    { timestamps: true }
);

export const UserGameModel = mongoose.model<IUserGame>(
    "UserGame",
    UserGameSchema
);
