import { Tenant } from "../model/tenant.model.js";
import { User } from "../model/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAccessToken } from "../utils/generateAccessAndRefreshTokens.js";


const getTenants = asyncHandler(async (req, res) => {
    const tenants = await Tenant.find();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tenants,
                "Tenants data fetched successfully"
            )
        )
});

const createTenant = asyncHandler(async (req, res) => {
    const {
        organizationName,
        admin,
        plan,
        status,
        trialEndDate
    } = req.body;

    const tenantExist = await Tenant.findOne({
        email: admin.email
    });

    if (tenantExist) {
        throw new ApiError(409, "Tenant already exist");
    }

    const userExist = await User.findOne({
        email: admin.email
    });

    if (userExist) {
        throw new ApiError(409, "User already exist");
    }

    const tenant = await Tenant.create({
        organizationName,
        email: admin.email,
        plan,
        status,
        trialEndDate
    });

    const orgAdmin = await User.create({
        username: admin.username,
        email: admin.email,
        password: admin.password,
        role: "orgadmin",
        tenantId: tenant._id
    });

    const safeOrgAdmin = await User.findById(orgAdmin._id).select("-password -refreshToken");

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {
                    tenant,
                    orgAdmin: safeOrgAdmin
                },
                "Tenant and organization admin created successfully"
            )
        )
});

const selectTenantById = asyncHandler(async (req, res) => {
    const { tenantId } = req.params;

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
        throw new ApiError(404, "Tenant not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tenant,
                "Tenant found successfully"
            )
        )
});

const suspendTenant = asyncHandler(async (req, res) => {
    const { tenantId } = req.params;

    const tenant = await Tenant.findByIdAndUpdate(
        tenantId, {
        $set: {
            status: "Suspended"
        }
    }, {
        returnDocument: "after"
    }
    );

    if (!tenant) {
        throw new ApiError(404, "Tenant not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tenant,
                "Tenant suspended successfully"
            )
        )
});

const deleteTenant = asyncHandler(async (req, res) => {
    const { tenantId } = req.params;

    const tenant = await Tenant.findByIdAndDelete(tenantId);

    if (tenant) {
        throw new ApiError(404, "Tenant not found!");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Tenant deleted successfully"
            )
        )
});

const extendTrial = asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const { days } = req.body;

    if (!days || days <= 0) {
        throw new ApiError(400, "Days must be greater than 0");
    }

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
        throw new ApiError(404, "Tenant not found");
    }

    const currentTrailEndDate = new Date(tenant.trialEndDate);
    console.log("Current Trail Date: ", currentTrailEndDate);

    currentTrailEndDate.setDate(
        currentTrailEndDate.getDate() + Number(days)
    );

    tenant.trialEndDate = currentTrailEndDate;
    await tenant.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tenant,
                "Tenant date extend successfully"
            )
        )
});

const impersonateTenant = asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    console.log("Req User: ", req.user);
    console.log("Role: ", req.user?.role);

    // Check whether logged-in user superadmin
    if (req.user?.role !== "superadmin") {
        throw new ApiError(403, "Only superadmin can impersonate tenant");
    }

    // Find tenant
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
        throw new ApiError(404, "Tenant not found");
    }

    const orgAdmin = await User.findOne({
        tenantId: tenant._id,
        role: "orgadmin"
    });

    if (!orgAdmin) {
        throw new ApiError(404, "Organization not found");
    }

    const accessToken = await generateAccessToken(orgAdmin._id);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    tenant,
                    orgAdmin: {
                        _id: orgAdmin._id,
                        username: orgAdmin.username,
                        email: orgAdmin.email,
                        role: orgAdmin.role,
                        tenantId: orgAdmin.tenantId
                    }
                },
                "Tenant impersonation successful"
            )
        )
});

export {
    getTenants,
    createTenant,
    selectTenantById,
    suspendTenant,
    deleteTenant,
    extendTrial,
    impersonateTenant
}