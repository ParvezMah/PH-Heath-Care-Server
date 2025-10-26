import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";

const createPatient = catchAsync(async (req: Request, res: Response) => {
    console.log("create patient : ", req.body);
    // TODO: Add your patient creation logic here
    
    res.status(200).json({
        success: true,
        message: 'Patient created successfully',
        data: req.body
    });
});

export const UserController = {
    createPatient
}