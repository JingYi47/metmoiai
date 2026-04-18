import mongoose from 'mongoose';
import ChatHistory from './src/models/chatHistoryModel.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const test = await ChatHistory.create({
            message: "test",
            response: "test",
            intent: "consultation",
            ip: "127.0.0.1"
        });
        console.log("Validation Success:", test.intent);
        await ChatHistory.deleteOne({ _id: test._id });
        process.exit(0);
    } catch (err) {
        console.error("Validation Failed:", err.message);
        process.exit(1);
    }
});
