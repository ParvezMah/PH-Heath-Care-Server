
const insertIntoDB = async (user: any, payload: any) => {
    console.log({user, payload})
    return {user, payload}
}

export const DoctorScheduleService = {
    insertIntoDB
}