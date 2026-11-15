"use client";

import * as React from "react";
import Image from "next/image";
import { QrCode, Trash2, Upload, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Blossom } from "@/components/blossom/blossom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";

/**
 * Resizes an image file to a maximum dimension of 512px on canvas
 * and exports as a base64 JPEG or PNG data URL (< 300 KB).
 */
function downscaleImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 512;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Prefer image/jpeg for smaller size if not transparent PNG
        const isPng = file.type === "image/png";
        const dataUrl = canvas.toDataURL(isPng ? "image/png" : "image/jpeg", 0.85);

        if (dataUrl.length > 400_000) {
          // If still over 400k, compress more aggressively
          const smaller = canvas.toDataURL("image/jpeg", 0.6);
          resolve(smaller);
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image for downscaling"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function PaymentQrCard() {
  const utils = api.useUtils();
  const { data: qrData, isLoading } = api.parent.getPaymentQr.useQuery();

  const [isEditing, setIsEditing] = React.useState(false);
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [note, setNote] = React.useState("");
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  // Sync state when query data changes or edit starts
  React.useEffect(() => {
    if (qrData) {
      setDataUrl(qrData.paymentQrData ?? null);
      setName(qrData.paymentQrName ?? "");
      setNote(qrData.paymentNote ?? "");
    }
  }, [qrData]);

  const setQrMutation = api.parent.setPaymentQr.useMutation({
    onSuccess: () => {
      toast.success("Payment QR updated");
      setIsEditing(false);
      void utils.parent.getPaymentQr.invalidate();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to save payment QR");
    },
  });

  const clearQrMutation = api.parent.clearPaymentQr.useMutation({
    onSuccess: () => {
      toast.success("Payment QR removed");
      setDeleteOpen(false);
      setIsEditing(false);
      void utils.parent.getPaymentQr.invalidate();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to delete payment QR");
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      toast.error("Please upload a PNG, JPEG, or WebP image");
      return;
    }

    try {
      const resized = await downscaleImage(file);
      setDataUrl(resized);
      if (!isEditing) setIsEditing(true);
    } catch {
      toast.error("Could not process image. Please try another file.");
    }
  };

  const handleSave = () => {
    if (!dataUrl) {
      toast.error("Please select a QR code image");
      return;
    }

    setQrMutation.mutate({
      dataUrl,
      name: name.trim() ? name.trim() : undefined,
      note: note.trim() ? note.trim() : undefined,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (qrData) {
      setDataUrl(qrData.paymentQrData ?? null);
      setName(qrData.paymentQrName ?? "");
      setNote(qrData.paymentNote ?? "");
    } else {
      setDataUrl(null);
      setName("");
      setNote("");
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-pink-200/70 p-5 shadow-(--sh) bg-card flex items-center justify-center min-h-[160px]">
        <Loader2 className="size-5 animate-spin text-pink-400" />
      </Card>
    );
  }

  const hasQr = Boolean(qrData?.paymentQrData);

  return (
    <Card className="relative overflow-hidden rounded-2xl border-pink-200/70 p-5 shadow-(--sh) bg-card">
      <Blossom
        size={54}
        className="pointer-events-none absolute -top-2.5 -right-2.5 z-0 text-bubblegum opacity-30"
      />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 border-b border-pink-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-pink-100 text-pink-700">
              <QrCode className="size-4.5" />
            </span>
            <div>
              <h3 className="font-serif text-base font-medium text-ink">
                Payment QR
              </h3>
              <p className="text-xs text-ink-soft">
                Parents scan to pay tuition with any banking or UPI app
              </p>
            </div>
          </div>

          {hasQr && !isEditing && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-pink-200 text-xs text-pink-700 hover:bg-pink-50"
                onClick={() => setIsEditing(true)}
              >
                Change
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-ink-soft hover:bg-no-bg hover:text-no-fg"
                onClick={() => setDeleteOpen(true)}
                aria-label="Delete QR"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Display Mode */}
        {qrData?.paymentQrData && !isEditing ? (
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative size-28 shrink-0 overflow-hidden rounded-xl border border-pink-200/80 bg-white p-1.5 shadow-xs">
              <Image
                src={qrData.paymentQrData}
                alt="Studio Payment QR"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1 text-center sm:text-left">
              <h4 className="font-medium text-ink text-sm">
                {qrData.paymentQrName ?? "Studio Bank QR"}
              </h4>
              <p className="text-xs text-ink-soft leading-relaxed max-w-md">
                {qrData.paymentNote ??
                  "Scan with your mobile banking or UPI app. Teacher will mark payment once received."}
              </p>
              <div className="mt-2 flex items-center justify-center sm:justify-start gap-1.5 text-[11px] text-ok-fg font-medium">
                <span className="size-1.5 rounded-full bg-ok-dot" />
                Active on parent portal
              </div>
            </div>
          </div>
        ) : null}

        {/* Empty State */}
        {!hasQr && !isEditing ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-dashed border-pink-200 bg-pink-50/40 p-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-pink-100 text-pink-600">
              <AlertCircle className="size-7" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-medium text-ink">
                No payment QR uploaded yet
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                Parents won&apos;t see a QR in their portal until you upload one.
                VietQR, UPI, QRIS, or any banking QR is supported.
              </p>
            </div>
            <Button
              size="sm"
              className="rounded-full [background-image:var(--grad-pink)] text-white shadow-(--sh-pink)"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-1.5 size-3.5" />
              Upload QR
            </Button>
          </div>
        ) : null}

        {/* Edit / Upload Mode */}
        {isEditing && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
              {dataUrl ? (
                <div className="relative size-28 shrink-0 overflow-hidden rounded-xl border border-pink-200 bg-white p-1.5">
                  <Image
                    src={dataUrl}
                    alt="QR Preview"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex size-28 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-pink-300 bg-pink-50/50 hover:bg-pink-100/50 text-pink-600"
                >
                  <Upload className="size-5" />
                  <span className="text-[11px] font-medium">Select image</span>
                </div>
              )}

              <div className="flex flex-1 flex-col gap-3 w-full">
                <div>
                  <Label htmlFor="qr-name" className="text-xs text-ink font-medium">
                    QR Title (optional)
                  </Label>
                  <Input
                    id="qr-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. VietQR / BIDV Bank / UPI"
                    className="mt-1 h-9 rounded-full border-pink-200 text-xs"
                    maxLength={120}
                  />
                </div>

                <div>
                  <Label htmlFor="qr-note" className="text-xs text-ink font-medium">
                    Payment Instructions / Note
                  </Label>
                  <Input
                    id="qr-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Pay to BIDV · Nguyen Minh Anh — put student name in note"
                    className="mt-1 h-9 rounded-full border-pink-200 text-xs"
                    maxLength={280}
                  />
                </div>

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full border-pink-200 text-xs text-pink-700 hover:bg-pink-50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-1.5 size-3" />
                    {dataUrl ? "Choose different image" : "Upload image"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-pink-100 pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full text-xs text-ink-soft"
                onClick={handleCancel}
                disabled={setQrMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 rounded-full [background-image:var(--grad-pink)] text-xs text-white shadow-(--sh-pink)"
                onClick={handleSave}
                disabled={!dataUrl || setQrMutation.isPending}
              >
                {setQrMutation.isPending ? "Saving..." : "Save QR"}
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remove Payment QR"
        description="Are you sure you want to remove your studio payment QR? Parents will no longer see a QR to scan in the portal."
        confirmText="Remove QR"
        cancelText="Cancel"
        variant="destructive"
        isLoading={clearQrMutation.isPending}
        onConfirm={() => clearQrMutation.mutate()}
      />
    </Card>
  );
}
