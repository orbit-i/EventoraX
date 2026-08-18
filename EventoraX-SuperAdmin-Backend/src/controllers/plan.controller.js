import { Plan } from "../model/plan.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createPlan = asyncHandler(async (req, res) => {
    const {
        planName,
        planTier,
        monthlyPrice,
        yearlyPrice,
        billingCycle,
        description,
        features,
        maxUsers,
        storageLimit,
        unlimited,
        status,
        isPopular
    } = req.body;

    const planExist = await Plan.findOne({ planName });

    if (planExist) {
        throw new ApiError(409, "Plan already exist");
    }

    const plan = await Plan.create({
        planName,
        planTier,
        monthlyPrice,
        yearlyPrice,
        billingCycle,
        description,
        features,
        maxUsers,
        storageLimit,
        unlimited,
        status,
        isPopular
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                plan,
                "Plan created successfully"
            )
        )
});

const getAllPlans = asyncHandler(async (req, res) => {
    const plans = await Plan.find().sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                plans,
                "Plans fetched successfully"
            )
        )
});

const getPlan = asyncHandler(async (req, res) => {
    const { planId } = req.params;

    const plan = await Plan.findById(planId);

    if (!plan) {
        throw new ApiError(403, "Plan not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                plan,
                "Plan fetched successfully"
            )
        )
});

const updatePlan = asyncHandler(async (req, res) => {
    console.log("Update Plan API HIT!", updatePlan);
    const { planId } = req.params;

    const plan = await Plan.findById(planId);

    if (!plan) {
        throw new ApiError(404, "Plan not found");
    }

    const updatedPlan = await Plan.findByIdAndUpdate(
        planId,
        {
            $set: req.body
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlan,
                "Plan updated successfully"
            )
        )
});

const deletePlan = asyncHandler(async (req, res) => {
    const { planId } = req.params;

    const plan = await Plan.findById(planId);

    if (!plan) {
        throw new ApiResponse(404, "Plan not found");
    }

    await Plan.findByIdAndDelete(planId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Plan deleted successfully"
            )
        )
});

export { createPlan, getAllPlans, getPlan, updatePlan }