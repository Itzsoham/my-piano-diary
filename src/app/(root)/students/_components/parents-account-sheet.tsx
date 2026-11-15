"use client";

import * as React from "react";
import {
  CalendarDays,
  Check,
  Copy,
  Dices,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Mail,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Blossom, Squiggle } from "@/components/blossom/blossom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { api, type RouterOutputs } from "@/trpc/react";

type ParentItem = RouterOutputs["parent"]["list"][number];
type StudentOption = { id: string; name: string; avatar: string | null };

interface ParentsAccountSheetProps {
  students: StudentOption[];
  parent?: ParentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

function generateSecurePassword(length = 12): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  let pass = "";
  const cryptoObj =
    typeof window !== "undefined"
      ? window.crypto ||
        (window as unknown as { msCrypto: Crypto }).msCrypto
      : null;
  if (!cryptoObj) {
    for (let i = 0; i < length; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
  }
  const values = new Uint32Array(length);
  cryptoObj.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    pass += chars[(values[i] ?? 0) % chars.length];
  }
  return pass;
}

export function ParentsAccountSheet({
  students,
  parent,
  open,
  onOpenChange,
}: ParentsAccountSheetProps) {
  const isEdit = Boolean(parent);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<string[]>(
    [],
  );

  // Success dialog for created account revealing password once
  const [createdInfo, setCreatedInfo] = React.useState<{
    email: string;
    password: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Hydrate state
  const targetKey = parent?.id ?? "new";
  const [hydratedKey, setHydratedKey] = React.useState<string | null>(null);

  if (open && hydratedKey !== targetKey) {
    setHydratedKey(targetKey);
    setName(parent?.name ?? "");
    setEmail(parent?.email ?? "");
    setPassword(parent ? "" : generateSecurePassword(12));
    setSelectedStudentIds(parent?.students.map((s) => s.id) ?? []);
  } else if (!open && hydratedKey !== null) {
    setHydratedKey(null);
  }

  const utils = api.useUtils();

  const createMutation = api.parent.create.useMutation({
    onSuccess: (data) => {
      void utils.parent.list.invalidate();
      setCreatedInfo({
        email: data.email ?? email,
        password,
        name: data.name ?? name,
      });
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to create parent account");
    },
  });

  const updateMutation = api.parent.update.useMutation({
    onError: (err) => {
      toast.error(err.message ?? "Failed to update parent details");
    },
  });

  const setStudentsMutation = api.parent.setStudents.useMutation({
    onError: (err) => {
      toast.error(err.message ?? "Failed to update linked students");
    },
  });

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    setStudentsMutation.isPending;

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const handleGeneratePassword = () => {
    setPassword(generateSecurePassword(12));
    setShowPassword(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter the parent's name");
      return;
    }

    if (selectedStudentIds.length === 0) {
      toast.error("Please link at least one student");
      return;
    }

    if (!isEdit) {
      if (!email.trim() || !email.includes("@")) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }

      createMutation.mutate({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        studentIds: selectedStudentIds,
      });
    } else if (parent) {
      try {
        await updateMutation.mutateAsync({
          parentId: parent.id,
          name: name.trim(),
          password: password.trim() ? password.trim() : undefined,
        });

        await setStudentsMutation.mutateAsync({
          parentId: parent.id,
          studentIds: selectedStudentIds,
        });

        void utils.parent.list.invalidate();
        toast.success("Parent account updated");
        onOpenChange(false);
      } catch {
        // Handled by onError
      }
    }
  };

  const handleCopyCredentials = () => {
    if (!createdInfo) return;
    const text = `Parent Portal Login:\nURL: ${window.location.origin}/login\nEmail: ${createdInfo.email}\nPassword: ${createdInfo.password}`;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Login details copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const title = isEdit ? "Edit Parent Account" : "Add Parent Account";
  const description = isEdit
    ? "Update parent info, reset their password, or adjust linked students."
    : "Create a login for a parent to view only their children's lessons and pay tuition.";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-x-hidden overflow-y-auto rounded-l-3xl border-(--line-pink) sm:max-w-150">
          {/* Header band matching student-sheet design */}
          <SheetHeader className="border-b border-(--line-pink) bg-[linear-gradient(160deg,var(--pink-50),var(--surface)_78%)] px-6 pt-6 pb-5">
            <div className="inline-block">
              <SheetTitle className="text-ink flex items-center gap-2 font-serif text-xl leading-tight font-normal sm:text-2xl">
                <Blossom className="text-bubblegum" size={19} />
                {title}
              </SheetTitle>
              <Squiggle className="text-bubblegum mt-1 h-2 w-full" />
            </div>
            <SheetDescription className="text-ink-soft text-sm">{description}</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 px-6 pt-6 pb-8">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="parent-name" className="text-sm font-medium text-pink-700">
                    Parent Full Name
                  </Label>
                  <Input
                    id="parent-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="h-11 rounded-2xl border-(--line-pink) focus-visible:ring-pink-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent-email" className="text-sm font-medium text-pink-700">
                    Email Address (Login ID)
                  </Label>
                  <Input
                    id="parent-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    disabled={isEdit}
                    className="h-11 rounded-2xl border-(--line-pink) focus-visible:ring-pink-400 disabled:bg-pink-50/50 disabled:opacity-75"
                    required
                  />
                  {isEdit && (
                    <p className="text-xs text-ink-soft">
                      Email address cannot be changed after creation.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="parent-password" className="text-sm font-medium text-pink-700">
                      {isEdit ? "Reset Password (optional)" : "Password"}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleGeneratePassword}
                      className="h-7 gap-1 rounded-full px-2.5 text-xs font-semibold text-pink-700 hover:bg-pink-100 hover:text-pink-800"
                    >
                      <Dices className="size-3.5" />
                      Generate
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="parent-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        isEdit
                          ? "Leave blank to keep existing password"
                          : "Min 8 characters"
                      }
                      className="h-11 rounded-2xl border-(--line-pink) pr-10 focus-visible:ring-pink-400"
                      minLength={isEdit && !password ? 0 : 8}
                      required={!isEdit}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Linked Students Section */}
              <div className="space-y-4 rounded-2xl border border-(--line-pink) bg-pink-50/40 p-4 shadow-(--sh-sm) sm:space-y-5 sm:p-5">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-pink-700">
                    Linked Students ({selectedStudentIds.length} selected)
                  </Label>
                  <p className="text-xs text-ink-soft">
                    Check all students that belong to this parent (e.g. siblings):
                  </p>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {students.map((student) => {
                    const isChecked = selectedStudentIds.includes(student.id);
                    return (
                      <label
                        key={student.id}
                        className={`bg-card flex items-center gap-3 rounded-2xl border p-2.5 shadow-xs transition cursor-pointer ${
                          isChecked
                            ? "border-pink-300 ring-1 ring-pink-300 bg-pink-50/30"
                            : "border-(--line-pink) hover:border-pink-200"
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggleStudent(student.id)}
                          className="rounded-md border-pink-300 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                        />
                        <Avatar className="size-8 border border-pink-100">
                          <AvatarImage src={student.avatar ?? ""} />
                          <AvatarFallback className="bg-pink-100 text-xs font-bold text-pink-700">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-ink truncate flex-1">
                          {student.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col justify-end gap-2 pt-2 sm:flex-row sm:gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 rounded-full sm:h-auto"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="h-11 rounded-full [background-image:var(--grad-pink)] px-6 font-semibold text-white shadow-(--sh-pink) transition hover:scale-[1.02] hover:shadow-lg hover:brightness-110 sm:h-auto"
                >
                  {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {isSaving
                    ? "Saving..."
                    : isEdit
                      ? "Save Changes"
                      : "Create Account"}
                </Button>
              </div>
            </form>

            {/* Parent Information card when editing */}
            {parent && (
              <div className="space-y-4 rounded-2xl border border-(--line-strong) p-4 sm:p-5">
                <h4 className="text-ink font-serif text-base font-normal">
                  Account Details
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-pink-700"
                    >
                      <User className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-ink-soft text-xs font-semibold">
                        Parent User
                      </div>
                      <div className="text-ink text-sm truncate">
                        {parent.name ?? "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700"
                    >
                      <Mail className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-ink-soft text-xs font-semibold">
                        Login Email
                      </div>
                      <div className="text-ink text-sm truncate font-mono">
                        {parent.email ?? "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-sand-700"
                    >
                      <GraduationCap className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-ink-soft text-xs font-semibold">
                        Linked Children
                      </div>
                      <div className="text-ink text-sm">
                        {parent.students.length} student(s) linked
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Created Password Alert Dialog */}
      <Dialog
        open={Boolean(createdInfo)}
        onOpenChange={(open) => !open && setCreatedInfo(null)}
      >
        <DialogContent className="max-w-md rounded-3xl border-pink-200">
          <DialogHeader>
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-pink-100 text-xl">
              🌸
            </div>
            <DialogTitle className="text-center font-serif text-lg font-normal text-ink">
              Parent Account Created!
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-ink-soft">
              Copy these login credentials and share them with the parent.
              For security, our database only stores the hashed password.
            </DialogDescription>
          </DialogHeader>

          {createdInfo && (
            <div className="rounded-2xl border border-pink-200 bg-pink-50/60 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-pink-200/60">
                <span className="text-ink-soft">Name:</span>
                <span className="font-semibold text-ink">{createdInfo.name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-pink-200/60">
                <span className="text-ink-soft">Login Email:</span>
                <span className="font-mono font-medium text-ink">{createdInfo.email}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-ink-soft">Password:</span>
                <span className="font-mono font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded">
                  {createdInfo.password}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button
              className="flex-1 rounded-full [background-image:var(--grad-pink)] text-white shadow-(--sh-pink)"
              onClick={handleCopyCredentials}
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 size-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 size-4" />
                  Copy Credentials
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-pink-200 text-ink-soft"
              onClick={() => setCreatedInfo(null)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
