import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ connected to mongoDB with host`, db.connection.host);
  } catch (error) {
    console.log(`❌ error when connecting to mongoDB`, error.message);
    process.exit(1);
  }
};
