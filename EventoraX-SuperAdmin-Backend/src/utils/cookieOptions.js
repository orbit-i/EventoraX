import { env } from "../config/env.js";

const isProduction = env.NODE_ENV === "production";

export const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "Lax"
}