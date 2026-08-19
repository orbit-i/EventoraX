import { Tenant } from '../model/tenant.model.js';
import { Transaction } from '../model/transaction.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const getRevenueOverview = asyncHandler(async (req, res) => {
    const transactionSummary = await Transaction.aggregate([
        {
            $group: {
                _id: null,

                totalRevenue: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "Confirmed"] },
                            "$amount",
                            0
                        ]
                    }
                },

                outstanding: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "Pending"] },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        }
    ]);

    const subscriptionSummary = await Tenant.aggregate([
        {
            $match: {
                status: "Active"  // ----> stage 1
            }
        },
        {
            $lookup: {
                from: "plans",
                localField: "plan",
                foreignField: "planName",
                as: "planDetails"
            }
        },
        {
            $unwind: "$planDetails"
        },
        {
            $match: {
                "planDetails.status": "Active"
            }
        },
        {
            $group: {
                _id: null,

                monthlyRecurringRevenue: {
                    $sum: "$planDetails.monthlyPrice"
                },
                activeSubscriptions: {
                    $sum: 1
                }
            }
        }
    ]);

    const transactionData = transactionSummary[0] || {
        totalRevenue: 0,
        outstanding: 0
    };

    const subscriptionData = subscriptionSummary[0] || {
        monthlyRecurringRevenue: 0,
        activeSubscriptions: 0
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    totalRevenue: transactionData.totalRevenue,
                    outstanding: transactionData.outstanding,
                    monthlyRecurringRevenue: subscriptionData.monthlyRecurringRevenue,
                    activeSubscriptions: subscriptionData.activeSubscriptions
                },
                "Revenue overview fetched successfully"
            )
        )
});

const getRevenueGrowth = asyncHandler(async (req, res) => {
    const revenueGrowth = await Transaction.aggregate([
        {
            $match: {
                status: "Confirmed"
            }
        },
        {
            $group: {
                _id: {
                    year: {
                        $year: "$transactionDate"
                    },
                    month: {
                        $month: "$transactionDate"
                    }
                },
                revenue: {
                    $sum: "$amount"
                }
            }
        },
        {
            $sort: {
                "_id.year": 1,
                "_id.month": 1
            }
        },
        {
            $project: {
                _id: 0,
                year: "$_id.year",
                month: "$_id.month",
                revenue: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                revenueGrowth,
                "Revenue Growth data fetched successfully"
            )
        )
});

const getPlanDistribution = asyncHandler(async (req, res) => {
    const planDistribution = await Tenant.aggregate([
        {
            $group: {
                _id: "$plan",
                tenantCount: {
                    $sum: 1
                }
            }
        },
        {
            $group: {
                _id: null,
                totalTenants: {
                    $sum: "$tenantCount"
                },
                plans: {
                    $push: {
                        planName: "$_id",
                        tenantCount: "$tenantCount"
                    }
                }
            }
        },
        {
            $unwind: "$plans"
        },
        {
            $project: {
                _id: 0,
                planName: "$plans.planName",
                tenantCount: "$plans.tenantCount",
                percentage: {
                    $round: [
                        {
                            $multiply: [
                                {
                                    $divide: [
                                        "$plans.tenantCount",
                                        "$totalTenants"
                                    ]
                                },
                                100
                            ]
                        },
                        2
                    ]
                }
            }
        },
        {
            $sort: {
                percentage: -1
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                planDistribution,
                "Plan distribution fetched successfully"
            )
        )
});

export {
    getRevenueOverview,
    getRevenueGrowth,
    getPlanDistribution
}