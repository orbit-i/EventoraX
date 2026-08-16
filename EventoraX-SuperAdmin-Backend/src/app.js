import express, { urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json({ limit: '16kb' }));
app.use(urlencoded({ extended: 'true', limit: '16kb' }));
app.use(cookieParser());

// import routes
import userRouter from './routes/auth.routes.js';

// declare routes
app.use("/api/v1/auth", userRouter);

export default app;