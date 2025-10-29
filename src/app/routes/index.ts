import express from 'express';
import { UserRoutes } from '../modules/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { ScheduleRoutes } from '../modules/schedule/schedule.route';
import { doctorScheduleRoutes } from '../modules/doctorSchedule/doctorSchedule.routes';
import { SpecialtiesRoutes } from '../modules/specialities/specialties.routes';
import { DoctorRoutes } from '../modules/doctor/doctor.routes';
import { AppointmentRoutes } from '../modules/appointment/appointment.routes';
import { PrescriptionRoutes } from '../modules/prescription/prescription.routes';
import { ReviewRoutes } from '../modules/review/review.routes';
import { PatientRoutes } from '../modules/patient/patient.routes';

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
    },
    {
        path: '/doctor',
        route: DoctorRoutes
    },
    {
        path: '/appointment',
        route: AppointmentRoutes
    },
    {
        path: '/prescription',
        route: PrescriptionRoutes
    },
    {
        path: '/review',
        route: ReviewRoutes
    },
    {
        path: '/patient',
        route: PatientRoutes
    },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;