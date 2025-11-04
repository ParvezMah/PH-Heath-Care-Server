import httpStatus  from 'http-status';
import { AppointmentStatus, PaymentStatus, Prisma, UserRole } from "@prisma/client";
import { IOptions, paginationHelper } from "../../helpers/paginationHelper";
import { stripe } from "../../helpers/stripe";
import { prisma } from "../../shared/prisma";
import { IJWTPayload } from "../../types/common";
import { v4 as uuidv4 } from 'uuid';
import ApiError from "../../errors/ApiError";

const createAppointment = async (user: IJWTPayload, payload: { doctorId: string, scheduleId: string }) => {
    const patientData = await prisma.patient.findUniqueOrThrow({
        where: {
            email: user.email
        }
    });

    const doctorData = await prisma.doctor.findUniqueOrThrow({
        where: {
            id: payload.doctorId,
            isDeleted: false
        }
    });

    const isBookedOrNot = await prisma.doctorSchedules.findFirstOrThrow({
        where: {
            doctorId: payload.doctorId,
            scheduleId: payload.scheduleId,
            isBooked: false
        }
    })

    const videoCallingId = uuidv4();

    // console.log({patientId: patientData.id, doctorId: doctorData.id, scheduleId: payload.scheduleId, videoCallingId})

    const result = await prisma.$transaction(async (tnx) => {
        const appointmentData = await tnx.appointment.create({
            data: {
                patientId: patientData.id,
                doctorId: doctorData.id,
                scheduleId: payload.scheduleId,
                videoCallingId
            }
        })

        await tnx.doctorSchedules.update({
            where: {
                doctorId_scheduleId: {
                    doctorId: doctorData.id,
                    scheduleId: payload.scheduleId
                }
            },
            data: {
                isBooked: true
            }
        })

        const transactionId = uuidv4();

        const paymentData = await tnx.payment.create({
            data: {
                appointmentId: appointmentData.id,
                amount: doctorData.appointmentFee,
                transactionId
            }
        })

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer_email: user.email,
            line_items: [
                {
                    price_data: {
                        currency: "bdt",
                        product_data: {
                            name: `Appointment with ${doctorData.name}`,
                        },
                        unit_amount: doctorData.appointmentFee * 100,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                appointmentId: appointmentData.id,
                paymentId: paymentData.id
            },
            success_url: `https://www.programming-hero.com/`,
            cancel_url: `https://next.programming-hero.com/`,
        });

        return { paymentUrl: session.url };
    })


    return result;
};


const getMyAppointment = async (user: IJWTPayload, fillters: any, options: IOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
    const {...filterData} = fillters;

    const andConditions: Prisma.AppointmentWhereInput[] = [];
    // Searching by role
    if (user.role === UserRole.PATIENT) {
        andConditions.push({
            patient: {
                email: user.email
            }
        })
    }
    else if (user.role === UserRole.DOCTOR) {
        andConditions.push({
            doctor: {
                email: user.email
            }
        })
    }

    // Filtering
    if (Object.keys(filterData).length > 0) {
        const filterConditions = Object.keys(filterData).map(key => ({
            [key]: {
                equals: (filterData as any)[key]
            }
        }))

        andConditions.push(...filterConditions)
    }

    const whereConditions: Prisma.AppointmentWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.appointment.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder
        },
        include: user.role === UserRole.DOCTOR ?
            { patient: true } : { doctor: true }
    });

    const total = await prisma.appointment.count({
        where: whereConditions
    });


    return {
        meta: {
            total,
            limit,
            page
        },
        data: result
    }

}


const updateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus, user: IJWTPayload) => {
    const appointmentData = await prisma.appointment.findUniqueOrThrow({
        where: {
            id: appointmentId
        },
        include: {
            doctor: true
        }
    });

    if (user.role === UserRole.DOCTOR) {
        if (!(user.email === appointmentData.doctor.email))
            throw new ApiError(httpStatus.BAD_REQUEST, "This is not your appointment")
    }

    return await prisma.appointment.update({
        where: {
            id: appointmentId
        },
        data: {
            status
        }
    })

}

const getAllFromDB = async (
    filters: any,
    options: IOptions
) => {
    const { limit, page, skip } = paginationHelper.calculatePagination(options);
    const { patientEmail, doctorEmail, ...filterData } = filters;
    const andConditions = [];

    if (patientEmail) {
        andConditions.push({
            patient: {
                email: patientEmail
            }
        })
    }
    else if (doctorEmail) {
        andConditions.push({
            doctor: {
                email: doctorEmail
            }
        })
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map((key) => {
                return {
                    [key]: {
                        equals: (filterData as any)[key]
                    }
                };
            })
        });
    }

    // console.dir(andConditions, { depth: Infinity })
    const whereConditions: Prisma.AppointmentWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.appointment.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy:
            options.sortBy && options.sortOrder
                ? { [options.sortBy]: options.sortOrder }
                : {
                    createdAt: 'desc',
                },
        include: {
            doctor: true,
            patient: true
        }
    });
    const total = await prisma.appointment.count({
        where: whereConditions
    });

    return {
        meta: {
            total,
            page,
            limit,
        },
        data: result,
    };
};

const cancelUnpaidAppointments = async () => {
    try {
        console.log('Starting cancelUnpaidAppointments job at:', new Date().toISOString());
        
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

        const unPaidAppointments = await prisma.appointment.findMany({
            where: {
                createdAt: {
                    lte: thirtyMinAgo
                },
                paymentStatus: PaymentStatus.UNPAID
            },
            // include: {
            //     review: true // Include reviews to check if any exist
            // }
        });

        console.log(`Found ${unPaidAppointments.length} unpaid appointments to process`);

        const appointmentIdsToCancel = unPaidAppointments.map(appointment => appointment.id);
        
        if (appointmentIdsToCancel.length === 0) {
            console.log('No unpaid appointments to cancel');
            return;
        }
        console.log({appointmentIdsToCancel})

        await prisma.$transaction(async (tnx) => {
            // First delete any reviews associated with these appointments
            const deletedReviews = await tnx.review.deleteMany({
                where: {
                    appointmentId: {
                        in: appointmentIdsToCancel
                    }
                }
            });
            console.log(`Deleted ${deletedReviews.count} reviews`);

            // Then delete payments
            const deletedPayments = await tnx.payment.deleteMany({
                where: {
                    appointmentId: {
                        in: appointmentIdsToCancel
                    }
                }
            });
            console.log(`Deleted ${deletedPayments.count} payments`);

            // Now we can safely delete appointments
            const deletedAppointments = await tnx.appointment.deleteMany({
                where: {
                    id: {
                        in: appointmentIdsToCancel
                    }
                }
            });
            console.log(`Deleted ${deletedAppointments.count} appointments`);

            // Finally update doctor schedules
            for (const unPaidAppointment of unPaidAppointments) {
                await tnx.doctorSchedules.update({
                    where: {
                        doctorId_scheduleId: {
                            doctorId: unPaidAppointment.doctorId,
                            scheduleId: unPaidAppointment.scheduleId
                        }
                    },
                    data: {
                        isBooked: false
                    }
                });
            }
            console.log(`Updated ${unPaidAppointments.length} doctor schedules`);
        });
        
        console.log('Successfully completed cancelUnpaidAppointments job at:', new Date().toISOString());
    } catch (error) {
        console.error('Error in cancelUnpaidAppointments:', error);
        throw error;
    }
}

export const AppointmentService = {
    createAppointment,
    getMyAppointment,
    updateAppointmentStatus,
    getAllFromDB,
    cancelUnpaidAppointments
};