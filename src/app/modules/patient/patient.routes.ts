import express from 'express';
import { PatientController } from './patient.controller';

const router = express.Router();

router.get(
    '/',
    PatientController.getAllFromDB
);

router.get(
    '/:id',
    PatientController.getByIdFromDB
);

router.delete(
    '/soft/:id',
    PatientController.softDelete
);



export const PatientRoutes = router;