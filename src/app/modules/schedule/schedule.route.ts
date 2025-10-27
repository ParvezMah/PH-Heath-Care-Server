import express from "express";
import { ScheduleController } from "./schedule.controller";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
    "/",
    auth(UserRole.DOCTOR, UserRole.DOCTOR),
    ScheduleController.schedulesForDoctor
)

router.post(
    "/",
    ScheduleController.insertIntoDB
)

export const ScheduleRoutes = router;