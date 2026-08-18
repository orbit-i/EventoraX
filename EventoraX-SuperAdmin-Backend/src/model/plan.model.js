import mongoose, { Schema } from "mongoose";
import { type } from "os";

const planSchema = mongoose.Schema({
    planName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    planTier: {
        type: String,
        enum: ["Startup", "Pro", "Enterprise"],
        required: true
    },
    monthlyPrice: {
        type: Number,
        required: true,
        min: 0
    },
    yearlyPrice: {
        type: Number,
        required: true,
        min: 0
    },
    billingCycle: {
        type: String,
        enum: ["Monthly", "Yearly", "Both"],
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    features: {
        type: [String],
        default: []
    },
    maxUsers: {
        type: Number,
        default: null
    },
    storageLimit: {
        type: String,
        required: true
    },
    unlimited: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["Active", "Inactive", "Draft"],
        default: "Active"
    },
    isPopular: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const Plan = mongoose.model("Plan", planSchema);