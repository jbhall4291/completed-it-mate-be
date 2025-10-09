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
  isRealUser: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, default: null },
    email: { type: String, default: null, select: false },

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

    isRealUser: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Count matching UserGame docs
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

UserSchema.index(
  { usernameLower: 1 },
  { unique: true, partialFilterExpression: { usernameLower: { $type: "string" } } }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);