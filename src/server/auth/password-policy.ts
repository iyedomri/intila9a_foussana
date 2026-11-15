import { z } from "zod";

const hasLowercase = /[a-z]/;
const hasUppercase = /[A-Z]/;
const hasNumber = /[0-9]/;
const hasSymbol = /[^A-Za-z0-9]/;

export const passwordSchema = z
  .string()
  .min(12, "PASSWORD_TOO_SHORT")
  .max(128, "PASSWORD_TOO_LONG")
  .refine((value) => hasLowercase.test(value), "PASSWORD_NEEDS_LOWERCASE")
  .refine((value) => hasUppercase.test(value), "PASSWORD_NEEDS_UPPERCASE")
  .refine((value) => hasNumber.test(value), "PASSWORD_NEEDS_NUMBER")
  .refine((value) => hasSymbol.test(value), "PASSWORD_NEEDS_SYMBOL");

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "REQUIRED").max(320),
  password: z.string().min(1).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(40).max(256),
  newPassword: passwordSchema,
});
