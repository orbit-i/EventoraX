import express from "express";
import dotenv from "dotenv";
import orgRoutes from "./routes/orgnization.routes";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api", orgRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});