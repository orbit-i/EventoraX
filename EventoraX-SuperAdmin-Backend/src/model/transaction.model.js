import mongoose, { Schema } from "mongoose";

const transactionSchema = new Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: [
            "Bank Transfer",
            "Jazz Cash",
            "Easy Paisa",
            "Credit Card",
            "Debit Card"
        ],
        required: true
    },
    status: {
        type: String,
        enum: [
            "Pending",
            "Confirmed",
            "Rejected"
        ],
        default: "Pending"
    },
    transactionNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    transactionDate: {
        type: Date,
        required: true,
        default: Date.now
    }
}, { timestamps: true });

export const Transaction = mongoose.model("Transaction", transactionSchema);