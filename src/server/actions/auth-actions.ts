"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { loginSchema, registerSchema } from "@/lib/validations/auth-schemas";
import { signIn } from "@/server/auth";
import { db } from "@/server/db";

/**
 * Server action for user login
 */
export async function loginAction(formData: FormData) {
  try {
    // Extract and validate form data
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
      remember: formData.get("remember") === "true",
    };

    const validatedData = loginSchema.parse(rawData);

    // Attempt to sign in with credentials
    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { success: true, message: "Login successful!" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, message: "Invalid email or password." };
        default:
          return { success: false, message: "Something went wrong." };
      }
    }

    // Validation errors
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }

    return { success: false, message: "An unexpected error occurred." };
  }
}

/**
 * Server action for user registration
 */
export async function registerAction(formData: FormData) {
  try {
    // Extract and validate form data
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const validatedData = registerSchema.parse(rawData);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return { success: false, message: "Email already registered." };
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 10);

    // Create new user
    await db.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
      },
    });

    // Automatically sign in the new user
    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { success: true, message: "Account created successfully!" };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        message: "Failed to sign in after registration.",
      };
    }

    // Validation errors
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }

    return { success: false, message: "An unexpected error occurred." };
  }
}
