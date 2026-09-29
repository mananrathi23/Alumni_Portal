import mongoose from "mongoose";

// Resolves true once connected, false if the connection failed
export const connection = () => {
  return mongoose
    .connect(process.env.MONGO_URI, {
      dbName: "Alumni-Portal",
      // Per-instance pool. Total connections = pool size × number of instances,
      // so lower MONGO_MAX_POOL when running many replicas (Atlas M0 caps at 500).
      maxPoolSize: Number(process.env.MONGO_MAX_POOL) || 20,
      minPoolSize: Number(process.env.MONGO_MIN_POOL) || 2,
    })
    .then(() => {
      console.log("Connected to database.");
      return true;
    })
    .catch((err) => {
      console.log(`Some error occurred while connecting to database: ${err}`);
      return false;
    });
};
