import { z } from "zod";

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  remember: z.boolean().optional(),
});

/**
 * Register validation schema with password confirmation
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: "Name is required." })
      .max(100, { message: "Name must be less than 100 characters." }),
    email: z
      .string()
      .min(1, { message: "Email is required." })
      .email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." })
      .max(100, { message: "Password must be less than 100 characters." }),
    confirmPassword: z
      .string()
      .min(6, { message: "Confirm Password must be at least 6 characters." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/**
 * TypeScript types inferred from schemas
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
