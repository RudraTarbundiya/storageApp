import * as z from "zod";

export const loginSchema = z.object({
    email : z.email("Invalid email address"),
    password : z.string().min(4, "Password must be at least 4 characters long")
})

export const registerSchema = z.object({
    name : z.string().min(3, "Name must be at least 3 characters long"),
    email : z.email("Invalid email address"),
    password : z.string().min(4, "Password must be at least 4 characters long"),
    otp: z.string().length(4, "OTP must be 4 characters long")
})

export const changeProfileSchema = z.object({
    name : z.string().min(3, "Name must be at least 3 characters long").optional(),
    password : z.string().min(4, "Password must be at least 4 characters long").optional()
})