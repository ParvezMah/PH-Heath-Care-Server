import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { UserService } from "./user.service";
import sendResponse from "../../shared/sendResponse";
import pick from "../../helpers/pick";

const createPatient = catchAsync(async (req: Request, res: Response) => {

    const result = await UserService.createPatient(req);
    
    
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Patient created successfully!",
        data: result
    })
});


const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
    const {page, limit, searchTerm, sortBy, sortOrder, role, status} = req.query;

    const options = pick(req.query, ["page", "limit", "sorBy", "sortOrder"])

    const result = await UserService.getAllFromDB({page:Number(page), limit: Number(limit), searchTerm, sortBy, sortOrder, role, status});

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User retrive successfully!",
        data: result
    })
})





export const UserController = {
    createPatient,
    getAllFromDB
}