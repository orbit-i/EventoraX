import mongoose, { Schema } from "mongoose";
import { type } from "os";

const tenantSchema = new Schema({
    organizationName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    plan: {
        type: String,
        enum: ["Startup", "Pro", "Enterprise"],
        default: "Startup"
    },
    status: {
        type: String,
        enum: ["Active", "Suspended", "Trial"],
        default: "Trial"
    },
    trialEndDate: {
        type: Date
    },
    maxUsers: {
        type: Number,
        default: 10
    },
    storageLimit: {
        type: String,
        default: "10 GB"
    }
}, { timestamps: true });

export const Tenant = mongoose.model("Tenant", tenantSchema);