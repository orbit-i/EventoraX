import { env } from "../config/env";

const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal server error";

    return res
        .status(statusCode)
        .json({
            success: false,
            message,
            errors: err.errors || [],
            stack: env.NODE_ENV === 'development'
                ? err.stack
                : ''
        })
}

export { errorMiddleware }