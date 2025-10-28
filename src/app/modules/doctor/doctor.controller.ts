import { Request, Response } from "express";
import pick from "../../helpers/pick";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { DoctorService } from "./doctor.service";
import { doctorFilterableFields } from "./doctor.constant";

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
    const fillters = pick(req.query, doctorFilterableFields)

    const result = await DoctorService.getAllFromDB(fillters, options);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Doctor fetched successfully!",
        data: result
    })
})


export const DoctorController = {
    getAllFromDB
}