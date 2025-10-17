import mongoose from "mongoose"

const connectDB = async () => {
  try {
     const mongoURI = process.env.MONGODB_URL || process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB connection string not found in environment variables');
    }
    const conn = await mongoose.connect(mongoURI)

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB
