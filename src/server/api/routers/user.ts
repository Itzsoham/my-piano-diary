import { z } from "zod";
import { hash } from "bcryptjs";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import {
  updateUserSchema,
  passwordSchema,
} from "@/lib/validations/common-schemas";

export const userRouter = createTRPCRouter({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        teacher: {
          select: {
            id: true,
            _count: {
              select: {
                students: true,
                lessons: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if email is already taken by another user
      if (input.email) {
        const existingUser = await ctx.db.user.findUnique({
          where: { email: input.email },
        });

        if (existingUser && existingUser.id !== ctx.session.user.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email is already in use",
          });
        }
      }

      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
          email: input.email,
          image: input.image === "" ? null : input.image,
        },
      });
    }),

  // Update password
  updatePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: passwordSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user?.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User does not have a password set",
        });
      }

      // Verify current password
      const { compare } = await import("bcryptjs");
      const isValid = await compare(input.currentPassword, user.password);

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const hashedPassword = await hash(input.newPassword, 10);

      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { password: hashedPassword },
      });
    }),
});
