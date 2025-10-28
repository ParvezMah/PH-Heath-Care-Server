import express from 'express';
import { UserRoutes } from '../modules/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { ScheduleRoutes } from '../modules/schedule/schedule.route';
import { doctorScheduleRoutes } from '../modules/doctorSchedule/doctorSchedule.routes';
import { SpecialtiesRoutes } from '../modules/specialities/specialties.routes';

const router = express.Router();

const moduleRoutes = [
    {
        path: '/user',
        route: UserRoutes
    },
    {
        path: '/auth',
        route: AuthRoutes
    },
        {
        path: '/schedule',
        route: ScheduleRoutes
    },
        {
        path: '/doctor-schedule',
        route: doctorScheduleRoutes
    },

    {
        path: '/specialties',
        route: SpecialtiesRoutes
    }
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;