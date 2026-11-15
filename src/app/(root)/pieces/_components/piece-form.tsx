"use client";

import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, CalendarDays, Loader2, Music } from "lucide-react";

import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppLoader } from "@/components/ui/app-loader";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StarRating, difficultyScale } from "@/components/ui/star-rating";

const pieceFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  difficulty: z
    .number()
    .int("Difficulty must be an integer")
    .min(1, "Difficulty must be at least 1")
    .max(5, "Difficulty must be at most 5")
    .optional(),
});

type PieceFormValues = z.infer<typeof pieceFormSchema>;

export function PieceForm({
  pieceId,
  onSuccess,
}: {
  pieceId?: string;
  onSuccess?: () => void;
}) {
  const utils = api.useUtils();
  const router = useRouter();

  // Fetch piece data only if we have an ID (edit mode)
  const { data: piece, isLoading } = api.piece.getById.useQuery(
    { id: pieceId! },
    { enabled: !!pieceId },
  );

  const createMutation = api.piece.create.useMutation({
    onSuccess: () => {
      toast.success("Piece created successfully", { id: "piece-create" });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to create piece", {
        id: "piece-create",
      });
    },
    onSettled: () => {
      void utils.piece.getAll.invalidate();
      router.refresh();
    },
  });

  const updateMutation = api.piece.update.useMutation({
    onSuccess: () => {
      toast.success("Piece updated successfully", { id: "piece-update" });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update piece", {
        id: "piece-update",
      });
    },
    onSettled: () => {
      void utils.piece.getAll.invalidate();
      if (pieceId) {
        void utils.piece.getById.invalidate({ id: pieceId });
      }
      router.refresh();
    },
  });

  const form = useForm<PieceFormValues>({
    resolver: zodResolver(pieceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      difficulty: 1,
    },
  });

  React.useEffect(() => {
    if (piece) {
      form.reset({
        title: piece.title,
        description: piece.description ?? "",
        difficulty: piece.difficulty ?? 1,
      });
    }
  }, [piece, form]);

  const onSubmit = (data: PieceFormValues) => {
    if (pieceId) {
      updateMutation.mutate({
        id: pieceId,
        ...data,
        description: data.description ?? undefined,
        difficulty: data.difficulty ?? undefined,
      });
    } else {
      createMutation.mutate({
        ...data,
        description: data.description ?? undefined,
        difficulty: data.difficulty ?? undefined,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (pieceId && isLoading) {
    return (
      <AppLoader
        size="sm"
        className="min-h-48"
        text="Fetching piece details..."
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 sm:space-y-8"
        >
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-pink-700">Piece Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Für Elise, Moonlight Sonata..."
                      className="h-11 rounded-2xl border-(--line-pink) focus-visible:ring-pink-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Difficulty rating card */}
            <div className="space-y-3 rounded-2xl border border-(--line-pink) bg-pink-50/40 p-4 shadow-(--sh-sm) sm:space-y-4 sm:p-5">
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-pink-700">
                        Difficulty Rating
                      </FormLabel>
                      <span className="text-xs font-semibold text-pink-700">
                        {difficultyScale[field.value ?? 1]?.title}
                      </span>
                    </div>
                    <FormControl>
                      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-(--line-pink) bg-card/80 p-4">
                        <StarRating
                          value={field.value ?? 1}
                          onChange={field.onChange}
                          size="lg"
                          align="center"
                          showLabel
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs text-ink-soft">
                      Set a star rating (1–5) to help match students to appropriate repertoire.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes / description card */}
            <div className="space-y-4 rounded-2xl border border-(--line-pink) bg-pink-50/40 p-4 shadow-(--sh-sm) sm:space-y-5 sm:p-5">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-pink-700">
                      Notes & Composer Details
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add notes about composer, tempo, key, or teaching points..."
                        className="bg-card min-h-32 resize-none rounded-2xl border-(--line-pink) focus-visible:ring-pink-400"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Helpful instructions or reminders for lessons
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col justify-end gap-2 pt-2 sm:flex-row sm:gap-3">
            <Button
              type="button"
              className="h-11 rounded-full sm:h-auto"
              variant="ghost"
              onClick={() => onSuccess?.()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-full [background-image:var(--grad-pink)] px-6 font-semibold text-white shadow-(--sh-pink) transition hover:scale-[1.02] hover:shadow-lg hover:brightness-110 sm:h-auto"
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isPending
                ? pieceId
                  ? "Saving..."
                  : "Adding..."
                : pieceId
                  ? "Save Changes"
                  : "Add to Repertoire"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Piece Information card in edit mode */}
      {piece && (
        <div className="space-y-4 rounded-2xl border border-(--line-strong) p-4 sm:p-5">
          <h4 className="text-ink font-serif text-base font-normal">
            Piece Information
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-pink-700"
              >
                <BookOpen className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="text-ink-soft text-xs font-semibold">
                  Total Lesson Assignments
                </div>
                <div className="text-ink text-sm">
                  {"_count" in piece &&
                  piece._count &&
                  typeof piece._count === "object" &&
                  "lessons" in piece._count
                    ? `${piece._count.lessons} lessons recorded`
                    : "0 lessons recorded"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="bg-sand-100 text-sand-700 flex size-8 shrink-0 items-center justify-center rounded-lg"
              >
                <CalendarDays className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="text-ink-soft text-xs font-semibold">
                  Added to Repertoire
                </div>
                <div className="text-ink text-sm">
                  {new Date(piece.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
