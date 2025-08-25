// scripts/checkDb.ts
import mongoose from "mongoose";
import "dotenv/config";
import axios from "axios";
import { GameModel } from "../src/models/Game";

const MONGO_URI = process.env.MONGO_URI!;

async function checkDb() {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const count = await GameModel.countDocuments();
    console.log(`🎮 Found ${count} games in DB`);

    const sample = await GameModel.findOne().lean();
    console.log("Sample doc:", sample);

    await mongoose.disconnect();
    console.log("🔌 Disconnected");
}

checkDb().catch((err) => {
    console.error(err);
    process.exit(1);
});
