import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from "../utils/generateAccessAndRefreshTokens";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        minLength: 3,
        maxLength: 30
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
        default: ""
    }
}, { timestamps: true });

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 10)
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateTokens = () => {
    const accessToken = await generateAccessToken(this?._id);
    const refreshToken = await generateRefreshToken(this?._id);
    this.refreshToken = await bcrypt.hash(refreshToken, 10);

    await this.save({ validateBeforeSave: false })
    return {
        accessToken,
        refreshToken
    }
}

export const User = mongoose.model("User", userSchema);