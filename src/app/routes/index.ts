import express from 'express';
import { UserRoutes } from '../modules/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { ScheduleRoutes } from '../modules/schedule/schedule.route';

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
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;