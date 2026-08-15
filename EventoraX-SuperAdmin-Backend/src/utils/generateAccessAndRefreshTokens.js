import { jwt } from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId },
        env.ACCESS_TOKEN_SECRET,
        { expiresIn: env.ACCESS_TOKEN_EXPIRY }
    )
}

export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        env.REFRESH_TOKEN_SECRET,
        { expiresIn: env.REFRESH_TOKEN_EXPIRY }
    )
}