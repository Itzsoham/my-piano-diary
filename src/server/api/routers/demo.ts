/**
 * Demo seeding — public on purpose: the login page calls this before anyone is
 * signed in, so the "Try the demo" button can build a studio on demand.
 *
 * Every mutation is scoped to the single demo account and refuses to run
 * against a protected email, so this cannot reach a real teacher's data.
 * Each step is its own mutation so the client reports honest progress.
 */
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  seedAttendance,
  seedFamilies,
  seedLessons,
  seedPayments,
  seedReports,
  seedSetup,
  seedStudents,
} from "@/server/demo/seed-steps";

export const demoRouter = createTRPCRouter({
  setup: publicProcedure.mutation(() => seedSetup()),
  students: publicProcedure.mutation(() => seedStudents()),
  families: publicProcedure.mutation(() => seedFamilies()),
  lessons: publicProcedure.mutation(() => seedLessons()),
  attendance: publicProcedure.mutation(() => seedAttendance()),
  reports: publicProcedure.mutation(() => seedReports()),
  payments: publicProcedure.mutation(() => seedPayments()),
});
