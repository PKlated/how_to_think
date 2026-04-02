import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in .env")
}

let isConnected = false

export async function connectDB() {
  if (isConnected) return

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: "how_to_think",
    })
    isConnected = true
    console.log("✅ MongoDB Connected!")
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error)
    throw error
  }
}
