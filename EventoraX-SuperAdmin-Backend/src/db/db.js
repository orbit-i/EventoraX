import mongoose from 'mongoose';
import { env } from '../config/env.js';

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(env.MONGODB_URI);
        console.log(`MongoDb connected successfully ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDb connection failed", error);
        process.exit(1);
    }
}

export { connectDB }