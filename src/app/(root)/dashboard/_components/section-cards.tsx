"use client";

import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  CreditCard,
  XCircle,
} from "lucide-react";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SectionCards() {
  type DashboardOutput = RouterOutputs["earnings"]["getDashboard"];
  type StudentEarningsOutput = RouterOutputs["earnings"]["getByStudent"];

  const { data: earnings, isLoading } = api.earnings.getDashboard.useQuery() as {
    data: DashboardOutput | undefined;
    isLoading: boolean;
  };
  const { data: studentEarnings } = api.earnings.getByStudent.useQuery() as {
    data: StudentEarningsOutput | undefined;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalStudents = studentEarnings?.length ?? 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Earnings</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? "..." : formatCurrency(earnings?.totalEarnings ?? 0)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <DollarSign className="size-4" />
              All Time
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total revenue earned
          </div>
          <div className="text-muted-foreground">
            From all completed lessons
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Current Month Earnings</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading
              ? "..."
              : formatCurrency(earnings?.currentMonthEarnings ?? 0)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp className="size-4" />
              This Month
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Monthly income <CreditCard className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Revenue for{" "}
            {new Date().toLocaleString("default", { month: "long" })}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Loss from Cancellations</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading
              ? "..."
              : formatCurrency(earnings?.currentMonthLoss ?? 0)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-destructive">
              <XCircle className="size-4" />
              This Month
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-destructive line-clamp-1 flex gap-2 font-medium">
            Cancelled lessons <TrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Potential revenue lost this month
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Students</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalStudents}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp className="size-4" />
              This Month
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Students with lessons
          </div>
          <div className="text-muted-foreground">
            Active students this month
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
