"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";

import { loginSchema, registerSchema } from "@/lib/validations/auth-schemas";
import { signIn } from "@/server/auth";
import { db } from "@/server/db";
import { logError } from "@/lib/error-handler";

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

    // Fetch user details to return to client
    const user = await db.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true, email: true, name: true, image: true },
    });

    return {
      success: true,
      message: "Login successful!",
      user,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      logError(`Login failed - AuthError: ${error.type}`, error, {
        component: "Auth Action: Login",
        severity: "warning",
      });

      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, message: "Invalid email or password." };
        default:
          return { success: false, message: "Something went wrong." };
      }
    }

    // Validation errors
    if (error instanceof Error) {
      logError(`Login validation error: ${error.message}`, error, {
        component: "Auth Action: Login",
        severity: "warning",
      });
      return { success: false, message: error.message };
    }

    logError("Login error - Unknown", error, {
      component: "Auth Action: Login",
      severity: "error",
    });
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
    const newUser = await db.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
      },
      select: { id: true, email: true, name: true, image: true },
    });

    // Automatically sign in the new user
    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return {
      success: true,
      message: "Account created successfully!",
      user: newUser,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      logError(`Registration failed - AuthError`, error, {
        component: "Auth Action: Register",
        severity: "warning",
      });
      return {
        success: false,
        message: "Failed to sign in after registration.",
      };
    }

    // Validation errors
    if (error instanceof Error) {
      logError(`Registration validation error: ${error.message}`, error, {
        component: "Auth Action: Register",
        severity: "warning",
      });
      return { success: false, message: error.message };
    }

    logError("Registration error - Unknown", error, {
      component: "Auth Action: Register",
      severity: "error",
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}
