import express, { urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json({ limit: '16kb' }));
app.use(urlencoded({ extended: 'true', limit: '16kb' }));
app.use(cookieParser());

export default app;