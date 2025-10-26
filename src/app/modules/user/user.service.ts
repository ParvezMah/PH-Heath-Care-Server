import bcrypt from "bcryptjs";
import { Request } from "express";
import { fileUploader } from "../../helpers/fileUploader";
import { prisma } from "../../shared/prisma";

const createPatient = async (req: Request) => {
    if (req.file) {
        const uploadResult = await fileUploader.uploadToCloudinary(req.file)
        req.body.patient.profilePhoto = uploadResult?.secure_url
    }
    const hashPassword = await bcrypt.hash(req.body.password, 10);

    const result = await prisma.$transaction(async (tnx) => {
        await tnx.user.create({
            data: {
                email: req.body.patient.email,
                password: hashPassword
            }
        });

        return await tnx.patient.create({
            data: req.body.patient
        })
    })

    return result;

}

const getAllFromDB = async ({page, limit}: {page:number, limit:number}) => {
    const skip = (page-1)*limit;
    const result = await prisma.user.findMany({skip, take: limit});

    return result
}

export const UserService = {
    createPatient,
    getAllFromDB
}