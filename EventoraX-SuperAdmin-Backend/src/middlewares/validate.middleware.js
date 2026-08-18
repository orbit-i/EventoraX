import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        console.log("Validations Results: ", result);
        if (!result.success) {
            const errors = result.error.errors.map(
                (err) => err.message
            );
            return next(
                new ApiError(400, "validation failed", errors)
            );
        }
        console.log("Validation Passed");
        req.body = result.data;
        next();
    }
}