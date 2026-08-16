export const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        console.log("Validations Results: ", result);
        if (!result.success) {
            const errors = result.error.errors.map(
                (err) => err.message
            );
            return next(
                400,
                "Validation failed",
                errors
            );
        }
        console.log("Validation Passed");
        req.body = result.data;
        next();
    }
}