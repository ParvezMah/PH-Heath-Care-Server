import { UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../../shared/prisma";
import { jwtHelper } from "../../helpers/jwtHelper";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status"

const login = async (payload: { email: string, password: string }) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            email: payload.email,
            status: UserStatus.ACTIVE
        }
    })

    const isCorrectPassword = await bcrypt.compare(payload.password, user.password);
    if (!isCorrectPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Password is incorrect!")
    }

    const accessToken = jwtHelper.generateToken({ email: user.email, role: user.role }, "abcd", "1h");

    const refreshToken = jwtHelper.generateToken({ email: user.email, role: user.role }, "abcdefgh", "90d");

    return {
        accessToken,
        refreshToken,
        needPasswordChange: user.needPasswordChange
    }
}

export const AuthService = {
    login
}