import express from "express";
import { ScheduleController } from "./schedule.controller";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
    "/",
    auth(UserRole.DOCTOR, UserRole.ADMIN),
    ScheduleController.schedulesForDoctor
)

router.post(
    "/",
    auth(UserRole.ADMIN),
    ScheduleController.insertIntoDB
)


router.delete(
    "/:id",
    auth(UserRole.ADMIN),
    ScheduleController.deleteScheduleFromDB
)

export const ScheduleRoutes = router;