import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  username?: string | null;
  email?: string | null;
  usernameLower?: string | null;
  deviceId?: string | null;
  role: "anon" | "user";
  lastSeenAt: Date;
  gameCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, default: null },
    email: { type: String, default: null },

    usernameLower: {
      type: String,

    },

    deviceId: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },

    role: {
      type: String,
      enum: ["anon", "user"],
      default: "anon",
      index: true,
    },

    lastSeenAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Counts matching UserGame docs
UserSchema.virtual("gameCount", {
  ref: "UserGame",
  localField: "_id",
  foreignField: "userId",
  count: true,
});

UserSchema.pre("save", function (next) {
  if (this.username) this.usernameLower = this.username.toLowerCase();
  next();
});

// new unique index (only applies when usernameLower is actually set)
UserSchema.index(
  { usernameLower: 1 },
  { unique: true, partialFilterExpression: { usernameLower: { $type: "string" } } }
);


export const UserModel = mongoose.model<IUser>("User", UserSchema);