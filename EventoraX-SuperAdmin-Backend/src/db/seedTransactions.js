import dns from "node:dns";
dns.setServers(["8.8.8.8"]);
import { connectDB } from "./db.js";
import { Transaction } from "../model/transaction.model.js";
import { Tenant } from "../model/tenant.model.js";
import { ApiError } from "../utils/ApiError.js";

const seedTransactions = async (req, res) => {
    try {
        await connectDB();

        const tenants = await Tenant.find({
            _id: {
                $in: [
                    "6a82d2fd60e997d6c3a6ddfb",
                    "6a82f7fa0b057775b9ab8216",
                    "6a8441d5f5f591976e392a4d",
                    "6a8441fcf5f591976e392a4f"
                ]
            }
        });

        if (!tenants) {
            throw new ApiError(404, "Required tenants not found");
        }

        const nexgen = tenants.find(
            tenant => tenant.organizationName === "Nexgen Systems"
        );

        const everbloom = tenants.find(
            tenant => tenant.organizationName === "Everbloom Systems"
        );

        const devsinc = tenants.find(
            tenant => tenant.organizationName === "Devsinc Ltd"
        );

        const techInfo = tenants.find(
            tenant => tenant.organizationName === "TechInfo Ltd"
        );

        const transactions = [
            {
                tenantId: nexgen._id,
                amount: 150000,
                paymentMethod: "Bank Transfer",
                status: "Pending",
                transactionNumber: "IN-88210",
                transactionDate: "2026-8-24"
            },
            {
                tenantId: everbloom._id,
                amount: 45000,
                paymentMethod: "Jazz Cash",
                status: "Confirmed",
                transactionNumber: "IN-88209",
                transactionDate: "2026-8-23"
            },
            {
                tenantId: techInfo._id,
                amount: 210000,
                paymentMethod: "Easy Paisa",
                status: "Rejected",
                transactionNumber: "IN-88208",
                transactionDate: "2026-8-23"
            },
            {
                tenantId: devsinc._id,
                amount: 99000,
                paymentMethod: "Credit Card",
                status: "Confirmed",
                transactionNumber: "IN-88207",
                transactionDate: "2026-8-20"
            }
        ];

        await Transaction.deleteMany({});
        await Transaction.insertMany(transactions);

        console.log(`${transactions.length} transactions inserted successfully`);
        process.exit(0);
    } catch (error) {
        console.log("Transaction seeding failed", error);
        process.exit(1);
    }
}

seedTransactions();