// db.ts
import mongoose from "mongoose";

const connectDB = async (mongoUri?: string) => {
  try {
    const uri = mongoUri || (process.env.MONGO_URI as string);
    const conn = await mongoose.connect(uri);
    // console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
