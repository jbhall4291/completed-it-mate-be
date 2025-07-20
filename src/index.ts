//index.ts
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";

import userRoutes from "./routes/userRoutes";
import gameRoutes from "./routes/gameRoutes";

dotenv.config();

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

// Test route
app.get("/", (req, res) => {
  res.send("Server is running! Hooray!!!");
});

app.use("/api", userRoutes);
app.use("/api", gameRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
