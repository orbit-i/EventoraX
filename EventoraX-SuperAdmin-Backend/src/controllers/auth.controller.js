import { User } from "../model/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cookieOptions } from "../utils/cookieOptions.js";


const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body;

    const alreadyExist = await User.findOne({ email });
    if (alreadyExist) {
        throw new ApiError(400, "User already exists");
    }

    const user = await User.create({
        username,
        password,
        email,
        role
    });

    const { accessToken, refreshToken } = await user.generateTokens();

    const createdUser = await User.findById(user?._id).select("-refreshToken -password");

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                createdUser,
                "User registered successfully"
            )
        )
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await user.generateTokens();

    const loggedInUser = await User.findById(user?._id).select("-refreshToken -password");

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                loggedInUser,
                "User loggedIn successfully"
            )
        )
});

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    await User.findByIdAndUpdate(userId, {
        $unset: {
            refreshToken: 1
        }
    },
        {
            returnDocument: 'after'
        }
    )

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(
            new ApiResponse(
                200,
                {},
                "User logout successfully"
            )
        )
})

export { registerUser, loginUser, logoutUser }