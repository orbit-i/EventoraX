import dns from "node:dns";
import app from "./app.js";
import { connectDB } from "./db/db.js";
import { env } from "./config/env.js";
dns.setServers(["8.8.8.8"]);

connectDB()
    .then(() => {
        const server = app.listen(env.PORT || 5550, () => {
            console.log(`Server is listening on ${env.PORT}`);
            server.on("error", (error) => {
                console.log("Server error", error);
                throw error;
            })
        })
    })
    .catch((error) => {
        console.log("MongoDB connection failed", error);
    })
