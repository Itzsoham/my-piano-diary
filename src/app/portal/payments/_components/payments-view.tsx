"use client";

import * as React from "react";
import Image from "next/image";
import {
  AlertCircle,
  Calendar,
  Clock,
  Maximize2,
  QrCode,
  WalletCards,
} from "lucide-react";

import { Blossom } from "@/components/blossom/blossom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type CurrencyCode, useCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import { api, type RouterOutputs } from "@/trpc/react";

type ChildPaymentSummary = RouterOutputs["portal"]["payments"][number];

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export function PortalPaymentsView() {
  const { currency } = useCurrency();
  const { data: payments = [], isLoading: isPaymentsLoading } =
    api.portal.payments.useQuery();
  const { data: qr } = api.portal.qr.useQuery();

  const [qrDialogOpen, setQrDialogOpen] = React.useState(false);

  const statusBadgeConfig = {
    UNPAID: { label: "Unpaid", bg: "bg-no-bg", fg: "text-no-fg", dot: "bg-no-dot" },
    PARTIAL: { label: "Partial", bg: "bg-wait-bg", fg: "text-wait-fg", dot: "bg-wait-dot" },
    PAID: { label: "Paid", bg: "bg-ok-bg", fg: "text-ok-fg", dot: "bg-ok-dot" },
  };

  const hasQr = Boolean(qr?.paymentQrData);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-pink-700 uppercase tracking-wider">
          <Blossom size={14} className="text-bubblegum" />
          Tuition &amp; Payment QR
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink mt-1">
          Monthly Tuition &amp; Bank QR
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed max-w-2xl">
          Scan your teacher&apos;s direct QR code with any banking app to pay tuition out-of-band.
          After sending payment, notify your teacher and she will record the transaction here.
        </p>
      </div>

      {/* Payment QR Section */}
      <Card className="relative overflow-hidden rounded-3xl border-pink-200/80 bg-white p-6 shadow-(--sh)">
        <Blossom
          size={70}
          className="pointer-events-none absolute -top-4 -right-4 text-bubblegum opacity-25"
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {hasQr && qr?.paymentQrData ? (
            <div className="flex flex-col items-center gap-2">
              <div
                onClick={() => setQrDialogOpen(true)}
                className="group relative size-44 cursor-pointer overflow-hidden rounded-2xl border-2 border-pink-200 bg-white p-2 shadow-xs transition hover:shadow-md"
              >
                <Image
                  src={qr.paymentQrData}
                  alt={qr.paymentQrName ?? "Studio QR Code"}
                  fill
                  unoptimized
                  className="object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                  <span className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink shadow-xs">
                    <Maximize2 className="size-3.5" />
                    Enlarge QR
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQrDialogOpen(true)}
                className="text-xs text-pink-700 font-medium hover:underline flex items-center gap-1"
              >
                <Maximize2 className="size-3" />
                Tap to enlarge for camera scanning
              </button>
            </div>
          ) : (
            <div className="flex size-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/50 p-4 text-center">
              <AlertCircle className="size-7 text-pink-400" />
              <p className="text-xs font-medium text-ink">No QR uploaded yet</p>
              <p className="text-[10.5px] text-ink-soft">
                Your teacher hasn&apos;t added a studio QR yet.
              </p>
            </div>
          )}

          <div className="flex-1 flex flex-col gap-3 text-center md:text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
                <QrCode className="size-3.5" />
                {qr?.paymentQrName ?? "Studio Bank Transfer / UPI QR"}
              </div>
              <h2 className="font-serif text-lg font-medium text-ink mt-2">
                Scan &amp; Pay with Your Banking App
              </h2>
            </div>

            <div className="rounded-2xl border border-pink-200 bg-pink-50/50 p-4">
              <p className="text-xs font-semibold text-pink-800">
                Teacher&apos;s Instructions:
              </p>
              <p className="text-xs text-ink mt-1 leading-relaxed">
                {qr?.paymentNote ??
                  "Open your mobile banking app (VietQR, UPI, QRIS, etc.), scan the QR code above, and put your child's name in the transfer message."}
              </p>
            </div>

            <p className="text-[11.5px] text-ink-soft italic">
              ✨ <strong>Note:</strong> After paying, tell your teacher — she will mark the payment in her studio diary and your balance will update below.
            </p>
          </div>
        </div>
      </Card>

      {/* Tuition Breakdowns per Child */}
      <div className="space-y-6">
        <h2 className="font-serif text-xl font-normal text-ink flex items-center gap-2">
          <WalletCards className="size-5 text-pink-600" />
          Monthly Tuition Breakdown
        </h2>

        {isPaymentsLoading ? (
          <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-pink-200">
            <span className="text-xs text-ink-soft">Loading payment history...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-2xl border border-pink-200 bg-card p-6 text-center text-xs text-ink-soft">
            No tuition records found for your linked students.
          </div>
        ) : (
          payments.map((child) => (
            <ChildPaymentCard
              key={child.student.id}
              childPayment={child}
              currency={currency}
              statusBadgeConfig={statusBadgeConfig}
            />
          ))
        )}
      </div>

      {/* Enlarge QR Dialog for safe scanning */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 text-center bg-white border-pink-200">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-normal text-ink">
              {qr?.paymentQrName ?? "Studio Payment QR"}
            </DialogTitle>
          </DialogHeader>

          {qr?.paymentQrData && (
            <div className="mx-auto my-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center">
              <div className="relative size-64">
                <Image
                  src={qr.paymentQrData}
                  alt="Full-size Payment QR"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            </div>
          )}

          <p className="text-xs text-ink-soft px-4">
            Point your phone&apos;s camera or banking app at the code to scan.
          </p>

          <Button
            variant="outline"
            className="rounded-full border-pink-200 text-xs mt-2"
            onClick={() => setQrDialogOpen(false)}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChildPaymentCard({
  childPayment,
  currency,
  statusBadgeConfig,
}: {
  childPayment: ChildPaymentSummary;
  currency: CurrencyCode;
  statusBadgeConfig: Record<
    "UNPAID" | "PARTIAL" | "PAID",
    { label: string; bg: string; fg: string; dot: string }
  >;
}) {
  return (
    <Card className="rounded-2xl border-pink-200/70 p-5 shadow-(--sh) bg-card space-y-4">
      {/* Child Header */}
      <div className="flex items-center gap-3 border-b border-pink-100 pb-3">
        <Avatar className="size-9 border border-pink-200">
          <AvatarImage src={childPayment.student.avatar ?? ""} />
          <AvatarFallback className="bg-pink-100 text-xs font-bold text-pink-700">
            {getInitials(childPayment.student.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-serif text-base font-semibold text-ink">
            {childPayment.student.name}
          </h3>
          <p className="text-xs text-ink-soft">
            Standard rate: {formatCurrency(childPayment.student.lessonRate, currency)}/lesson
          </p>
        </div>
      </div>

      {/* Month Rows */}
      {childPayment.months.length === 0 ? (
        <p className="text-xs text-ink-soft py-2 italic">
          No lessons or billing records yet.
        </p>
      ) : (
        <div className="space-y-3">
          {childPayment.months.map((m) => {
            const statusConfig = statusBadgeConfig[m.status] ?? statusBadgeConfig.UNPAID;

            return (
              <div
                key={m.id}
                className="rounded-xl border border-pink-100 bg-pink-50/40 p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-pink-600" />
                    <span className="font-semibold text-xs sm:text-sm text-ink">
                      Month {m.month} / {m.year}
                    </span>
                  </div>

                  <Badge className={`${statusConfig.bg} ${statusConfig.fg} gap-1.5 border-transparent text-[11px]`}>
                    <span className={`size-1.5 rounded-full ${statusConfig.dot}`} />
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Amounts Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center bg-white/70 rounded-lg p-2.5 border border-pink-100/60 text-xs">
                  <div>
                    <span className="text-[10.5px] text-ink-soft uppercase tracking-wider block">
                      Expected
                    </span>
                    <span className="font-semibold text-ink tabular-nums">
                      {formatCurrency(m.expectedAmount, currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-ink-soft uppercase tracking-wider block">
                      Received
                    </span>
                    <span className="font-semibold text-ok-fg tabular-nums">
                      {formatCurrency(m.receivedAmount, currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-ink-soft uppercase tracking-wider block">
                      Remaining
                    </span>
                    <span className={`font-semibold tabular-nums ${m.remainingAmount > 0 ? "text-no-fg" : "text-ink-soft"}`}>
                      {formatCurrency(m.remainingAmount, currency)}
                    </span>
                  </div>
                </div>

                {/* Transaction history for this month */}
                {m.transactions.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                      Recorded Payments:
                    </span>
                    <ul className="mt-1 space-y-1">
                      {m.transactions.map((tx) => (
                        <li
                          key={tx.id}
                          className="flex items-center justify-between text-xs text-ink bg-white/50 px-2.5 py-1.5 rounded-md"
                        >
                          <span className="flex items-center gap-1.5 text-ink-soft">
                            <Clock className="size-3 text-pink-500" />
                            {new Date(tx.date).toLocaleDateString()}
                            {tx.method && (
                              <span className="rounded bg-pink-100 px-1.5 py-0.2 text-[10px] text-pink-800">
                                {tx.method}
                              </span>
                            )}
                          </span>
                          <span className="font-bold text-ok-fg tabular-nums">
                            +{formatCurrency(tx.amount, currency)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
