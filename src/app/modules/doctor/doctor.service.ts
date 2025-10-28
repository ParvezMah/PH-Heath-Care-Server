import { Prisma } from "@prisma/client";
import { IOptions, paginationHelper } from "../../helpers/paginationHelper";
import { prisma } from "../../shared/prisma";
import { doctorSearchableFields } from "./doctor.constant";
import { IDoctorUpdateInput } from "./doctor.interface";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { openai } from "../../helpers/open-router";

const getAllFromDB = async (filters: any, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, specialties, ...filterData } = filters;

  const andConditions: Prisma.DoctorWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: doctorSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // "", "medicine"
  if (specialties && specialties.length > 0) {
    andConditions.push({
      doctorSpecialties: {
        some: {
          specialities: {
            title: {
              contains: specialties,
              mode: "insensitive",
            },
          },
        },
      },
    });
  }

  if (Object.keys(filterData).length > 0) {
    const filterConditions = Object.keys(filterData).map((key) => ({
      [key]: {
        equals: (filterData as any)[key],
      },
    }));

    andConditions.push(...filterConditions);
  }

  const whereConditions: Prisma.DoctorWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.doctor.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      doctorSpecialties: {
        include: {
          specialities: true,
        },
      },
    },
  });

  const total = await prisma.doctor.count({
    where: whereConditions,
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

const getAISuggestions = async (payload: { symptoms: string }) => {
  if (!(payload && payload.symptoms)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "symptoms is required!");
  }

  const doctors = await prisma.doctor.findMany({
    where: { isDeleted: false },
    include: {
      doctorSpecialties: {
        include: {
          specialities: true,
        },
      },
    },
  });

  console.log({ doctors });

  const prompt = `
        You are a medical assistant AI. Based on the patient's symptoms, suggest the top 3 most suitable doctors.
        Each doctor has specialties and years of experience.
        Only suggest doctors who are relevant to the given symptoms.

        Symptoms: ${payload.symptoms}

        Here is the doctor list (in JSON):
        ${JSON.stringify(doctors, null, 2)}

        Return your response in JSON format with full individual doctor data. 
        `;

  const completion = await openai.chat.completions.create({
    model: "z-ai/glm-4.5-air:free",
    messages: [
        {
            role: "system",
            content:
                "You are a helpful AI medical assistant that provides doctor suggestions.",
        },
        {
            role: 'user',
            content: prompt,
        },
    ],
  });


};

const updateIntoDB = async (
  id: string,
  payload: Partial<IDoctorUpdateInput>
) => {
  // Partial -> karon amar sob update kora lagbena -> partial / olpo data update kora lagbe
  const doctorInfo = await prisma.doctor.findUniqueOrThrow({
    where: {
      id,
    },
  });

  const { specialities, ...doctorData } = payload;

  return await prisma.$transaction(async (tnx) => {
    if (specialities && specialities.length > 0) {
      const deleteSpecialtyIds = specialities.filter(
        (specialty) => specialty.isDeleted
      );

      for (const specialty of deleteSpecialtyIds) {
        await prisma.doctorSpecialties.deleteMany({
          where: {
            doctorId: id,
            specialitiesId: specialty.specialityId,
          },
        });
      }

      const createSpecialtyIds = specialities.filter(
        (specialty) => !specialty.isDeleted
      );

      for (const specialty of createSpecialtyIds) {
        await prisma.doctorSpecialties.create({
          data: {
            doctorId: id,
            specialitiesId: specialty.specialityId,
          },
        });
      }
    }

    const updatedData = await prisma.doctor.update({
      where: {
        id: doctorInfo.id,
      },
      data: doctorData,
      include: {
        doctorSpecialties: {
          include: {
            specialities: true,
          },
        },
      },

      //  doctor - doctorSpecailties - specialities
    });

    return updatedData;
  });
};

export const DoctorService = {
  getAllFromDB,
  getAISuggestions,
  updateIntoDB,
};
