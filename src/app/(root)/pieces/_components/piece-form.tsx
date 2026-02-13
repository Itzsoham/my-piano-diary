"use client";

import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
      toast.success("Piece created successfully");
      void utils.piece.getAll.invalidate();
      router.refresh();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to create piece");
    },
  });

  const updateMutation = api.piece.update.useMutation({
    onSuccess: () => {
      toast.success("Piece updated successfully");
      void utils.piece.getAll.invalidate();
      router.refresh();
      if (pieceId) {
        void utils.piece.getById.invalidate({ id: pieceId });
      }
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update piece");
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

  const isPending = createMutation.isPending ?? updateMutation.isPending;

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
    <div className="space-y-4 sm:space-y-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 sm:space-y-10"
        >
          <div className="space-y-4 sm:space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter piece title"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty</FormLabel>
                  <FormControl>
                    <div className="mb-2 flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-4">
                      <StarRating
                        value={field.value ?? 1}
                        onChange={field.onChange}
                        size="lg"
                        align="center"
                        showLabel
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {difficultyScale[field.value ?? 1]?.title}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4 sm:space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details about the piece..."
                      className="min-h-32 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add notes about the composer, style, or key details
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col justify-end gap-2 pt-4 sm:flex-row sm:gap-3 sm:pt-6">
            <Button
              type="button"
              className="h-10 rounded-full sm:h-auto"
              variant="ghost"
              onClick={() => onSuccess?.()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-10 rounded-full bg-pink-500 font-medium text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-pink-600 hover:shadow-md sm:h-auto"
            >
              {isPending
                ? pieceId
                  ? "Saving..."
                  : "Adding..."
                : pieceId
                  ? "Save Changes"
                  : "Add to Diary"}
            </Button>
          </div>
        </form>
      </Form>

      {piece && (
        <div className="space-y-3 rounded-lg border p-3 sm:space-y-4 sm:p-4">
          <h4 className="font-semibold">Piece Information</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Total Lessons:</span>{" "}
              <span className="font-medium">
                {"_count" in piece &&
                piece._count &&
                typeof piece._count === "object" &&
                "lessons" in piece._count
                  ? piece._count.lessons
                  : 0}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>{" "}
              <span className="font-medium">
                {new Date(piece.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
