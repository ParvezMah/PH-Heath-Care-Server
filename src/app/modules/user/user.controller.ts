import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { UserService } from "./user.service";

const createPatient = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.createPatient(req.body);
    
    
    res.status(200).json({
        success: true,
        message: 'Patient created successfully',
        data: req.body
    });
});

export const UserController = {
    createPatient
}