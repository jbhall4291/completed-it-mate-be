//User.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  gameCount?: number;
}


const UserSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Counts matching UserGame docs
UserSchema.virtual("gameCount", {
  ref: "UserGame",
  localField: "_id",
  foreignField: "userId",
  count: true,
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);