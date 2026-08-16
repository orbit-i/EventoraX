import express from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/register").post(validate(registerSchema), registerUser);
router.route("login").post(validate(loginSchema), loginUser);
router.route("/logout").post(verifyJWT, logoutUser);

export default router;