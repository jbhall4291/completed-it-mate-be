// app.ts
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
import cors from 'cors';
import { checkApiKey } from "./middleware/checkApiKey";


import userRoutes from "./routes/userRoutes";
import gameRoutes from "./routes/gameRoutes";
import testRoutes from "./routes/testRoutes";
import libraryRoutes from "./routes/libraryRoutes";
import communityRoutes from "./routes/communityRoutes";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://completed-it-mate-fe.vercel.app",
    "https://completeditmate.app"
  ],
  credentials: true
}));



// A simple 'is alive' test route
app.get("/", (req, res) => {
  res.send("Server is running! Hooray!!!");
});


app.use(checkApiKey);

/* istanbul ignore next: bootstrap-only side effect for runtime, not under test */
if (!process.env.JEST_WORKER_ID) {
  connectDB(); // Only connect to actual DB if we're NOT in a Jest test
}

app.use("/api", userRoutes);
app.use("/api", gameRoutes);
app.use("/api", libraryRoutes);
app.use("/api", communityRoutes);

app.use('/api', testRoutes);

export default app;
