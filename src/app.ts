// app.ts
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
import cors from 'cors';
import { checkApiKey } from "./middleware/checkApiKey";


import userRoutes from "./routes/userRoutes";
import gameRoutes from "./routes/gameRoutes";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: "http://localhost:3000",  
  credentials: true                 
}));



// A simple test route
app.get("/", (req, res) => {
  res.send("Server is running! Hooray!!!");
});


app.use(checkApiKey); 


if (!process.env.JEST_WORKER_ID) {
  connectDB(); // Only connect if we're NOT in a Jest test
}

console.log('testing pipeline....')

app.use("/api", userRoutes);
app.use("/api", gameRoutes);

export default app;  // <-- Supertest will import this
