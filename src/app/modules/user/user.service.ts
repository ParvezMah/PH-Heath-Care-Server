import bcrypt from "bcryptjs";
import { Request } from "express";
import { fileUploader } from "../../helpers/fileUploader";
import { prisma } from "../../shared/prisma";
import { paginationHelper } from "../../helpers/paginationHelper";
import { Admin, Doctor, Prisma, UserRole, UserStatus } from "@prisma/client";
import { userSearchableFields } from "./user.constant";
import { IJWTPayload } from "../../types/common";

const createPatient = async (req: Request) => {
    // Uploads the profile photo to Cloudinary (if a file is uploaded).
    if (req.file) {
        const uploadResult = await fileUploader.uploadToCloudinary(req.file)
        req.body.patient.profilePhoto = uploadResult?.secure_url
    }

    // Hashes the user’s password for security.
    const hashPassword = await bcrypt.hash(req.body.password, 10);

    

    // 3. in a single transaction (so that both succeed or both fail together).
    // prisma.$transaction() groups multiple DB Operations together.
    const result = await prisma.$transaction(async (tnx) => {
        // A record in the User table, and
        await tnx.user.create({
            data: {
                email: req.body.patient.email,
                password: hashPassword
            }
        });

        // A record in the Patient table
        return await tnx.patient.create({
            data: req.body.patient
        })
    })

    return result;

}

const createAdmin = async (req: Request): Promise<Admin> => {

    const file = req.file;

    if (file) {
        const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
        req.body.admin.profilePhoto = uploadToCloudinary?.secure_url
    }

    const hashedPassword: string = await bcrypt.hash(req.body.password, 10)

    const userData = {
        email: req.body.admin.email,
        password: hashedPassword,
        role: UserRole.ADMIN
    }

    const result = await prisma.$transaction(async (transactionClient) => {
        await transactionClient.user.create({
            data: userData
        });

        const createdAdminData = await transactionClient.admin.create({
            data: req.body.admin
        });

        return createdAdminData;
    });

    return result;
};

const createDoctor = async (req: Request): Promise<Doctor> => {

    const file = req.file;

    if (file) {
        const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
        req.body.doctor.profilePhoto = uploadToCloudinary?.secure_url
    }
    const hashedPassword: string = await bcrypt.hash(req.body.password, 10)

    const userData = {
        email: req.body.doctor.email,
        password: hashedPassword,
        role: UserRole.DOCTOR
    }

    const result = await prisma.$transaction(async (transactionClient) => {
        await transactionClient.user.create({
            data: userData
        });

        const createdDoctorData = await transactionClient.doctor.create({
            data: req.body.doctor
        });

        return createdDoctorData;
    });

    return result;
};

const getAllFromDB = async (params: any, options: any) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options)
    const { searchTerm, ...filterData } = params;

    const andConditions: Prisma.UserWhereInput[] = [];

    // Searching
    if (searchTerm) {
        andConditions.push({
            OR: userSearchableFields.map(field => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive"
                }
            }))
        })
    }

    // Filtering
    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: (filterData as any)[key]
                }
            }))
        })
    }

    console.log(andConditions)


    const whereConditions: Prisma.UserWhereInput = andConditions.length > 0 ? {
        AND: andConditions
    } : {}

    const result = await prisma.user.findMany({
        // Pagination
        skip, 
        take: limit,
        // Search
        where : {
            AND: whereConditions
        },
        // Sorting
        orderBy: {
            [sortBy]: sortOrder
        }
    });

    const total = await prisma.user.count({
        where: whereConditions
    });

    return {
        meta: {
            page,
            limit,
            total
        },
        data: result
    };
}

const getMyProfile = async (user: IJWTPayload) => {
    const userInfo = await prisma.user.findUniqueOrThrow({
        where: {
            email: user.email,
            status: UserStatus.ACTIVE
        },
        select: {
            id: true,
            email: true,
            needPasswordChange: true,
            role: true,
            status: true
        }
    })

    let profileData;

    if (userInfo.role === UserRole.PATIENT) {
        profileData = await prisma.patient.findUnique({
            where: {
                email: userInfo.email
            }
        })
    }
    else if (userInfo.role === UserRole.DOCTOR) {
        profileData = await prisma.doctor.findUnique({
            where: {
                email: userInfo.email
            }
        })
    }
    else if (userInfo.role === UserRole.ADMIN) {
        profileData = await prisma.admin.findUnique({
            where: {
                email: userInfo.email
            }
        })
    }

    return {
        ...userInfo,
        ...profileData
    };

};

const changeProfileStatus = async (id: string, payload: { status: UserStatus }) => {
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            id
        }
    })

    const updateUserStatus = await prisma.user.update({
        where: {
            id
        },
        data: payload
    })

    return updateUserStatus;
};

export const UserService = {
    createPatient,
    createAdmin,
    createDoctor,
    getAllFromDB,
    getMyProfile,
    changeProfileStatus
}