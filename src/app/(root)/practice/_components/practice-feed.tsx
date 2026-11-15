"use client";

import * as React from "react";
import confetti from "canvas-confetti";
import {
  Check,
  Clock,
  ExternalLink,
  MessageSquare,
  Play,
  Save,
  Send,
  Sparkles,
  Trash2,
  Users,
  Video,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";

import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { AppLoader } from "@/components/ui/app-loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { isMediaImage, parseVideoUrl } from "@/lib/practice-video";
import { api, type RouterOutputs } from "@/trpc/react";

type PracticeVideoItem =
  RouterOutputs["parent"]["practiceVideos"][number];

interface PracticeFeedProps {
  students: { id: string; name: string; avatar: string | null }[];
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

function formatMessageDate(dateString: Date | string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatMessageTime(dateString: Date | string): string {
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PracticeFeed({ students }: PracticeFeedProps) {
  const [selectedStudentId, setSelectedStudentId] =
    React.useState<string>("all");
  const [deleteTarget, setDeleteTarget] =
    React.useState<PracticeVideoItem | null>(null);
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);

  const utils = api.useUtils();

  const { data: videos = [], isLoading } = api.parent.practiceVideos.useQuery({
    studentId: selectedStudentId === "all" ? undefined : selectedStudentId,
  });

  const deleteMutation = api.parent.deleteVideo.useMutation({
    onSuccess: () => {
      toast.success("Practice post removed from studio");
      setDeleteTarget(null);
      void utils.parent.practiceVideos.invalidate();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to delete post");
    },
  });

  // Group videos by date string (WhatsApp / Zalo group chat style)
  const groupedVideos = React.useMemo(() => {
    const groups: { dateKey: string; items: PracticeVideoItem[] }[] = [];
    const map = new Map<string, PracticeVideoItem[]>();

    for (const v of videos) {
      const key = formatMessageDate(v.createdAt);
      const existing = map.get(key);
      if (existing) {
        existing.push(v);
      } else {
        const arr = [v];
        map.set(key, arr);
        groups.push({ dateKey: key, items: arr });
      }
    }

    return groups;
  }, [videos]);

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Top Filter Bar with Student Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-pink-200/80 bg-white/80 p-3 shadow-xs backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-pink-700" />
          <span className="text-xs font-semibold text-ink uppercase tracking-wider">
            Filter by Student:
          </span>

          {/* Student Filter Dropdown */}
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="rounded-full border border-pink-200 bg-pink-50/70 px-3 py-1.5 text-xs font-medium text-pink-900 focus:outline-pink-400 cursor-pointer shadow-2xs"
          >
            <option value="all">🌟 All Students ({videos.length})</option>
            {students.map((student) => {
              const studentCount = videos.filter(
                (v) => v.student.id === student.id,
              ).length;
              return (
                <option key={student.id} value={student.id}>
                  {student.name} ({studentCount})
                </option>
              );
            })}
          </select>
        </div>

        <Badge
          variant="outline"
          className="rounded-full border-pink-200 bg-pink-50 text-pink-800 text-[11px] self-start sm:self-auto"
        >
          {videos.length} Studio Post{videos.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {/* WhatsApp / Zalo Style Group Chat Container */}
      <div className="rounded-3xl border border-pink-200/90 bg-[linear-gradient(180deg,rgba(255,245,248,0.6),var(--surface)_85%)] p-4 sm:p-6 shadow-(--sh) min-h-[500px]">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <AppLoader size="sm" text="Opening studio practice chat..." />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-bubblegum/60 bg-card/60 px-6 py-14 text-center">
            <Mochi mood="sleepy" size={116} />
            <div>
              <p className="font-serif text-lg text-ink font-semibold">
                No practice posts yet
              </p>
              <p className="mt-1 max-w-sm text-xs text-ink-soft leading-relaxed">
                When parents share home recordings or practice photos from their
                portal, they will appear in this chat room for your review and
                feedback.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedVideos.map((group) => (
              <div key={group.dateKey} className="space-y-4">
                {/* Date Separator Pill */}
                <div className="flex justify-center">
                  <span className="rounded-full bg-white/95 border border-pink-200/80 px-3 py-1 text-[11px] font-semibold text-pink-700 shadow-2xs">
                    {group.dateKey}
                  </span>
                </div>

                {/* Message Cards */}
                <div className="space-y-4">
                  {group.items.map((video) => (
                    <TeacherChatCard
                      key={video.id}
                      video={video}
                      onDeleteClick={() => setDeleteTarget(video)}
                      onImageClick={(url) => setLightboxUrl(url)}
                      onCommentSaved={() => {
                        void utils.parent.practiceVideos.invalidate();
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teacher Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove Practice Post from Studio"
        description={`Are you sure you want to delete "${deleteTarget?.title}" by ${deleteTarget?.student.name}? This will permanently remove the post and video from the studio feed.`}
        confirmText={deleteMutation.isPending ? "Removing..." : "Remove Post"}
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate({ videoId: deleteTarget.id });
          }
        }}
      />

      {/* Lightbox Modal for Full Image View */}
      <Dialog
        open={Boolean(lightboxUrl)}
        onOpenChange={(open) => !open && setLightboxUrl(null)}
      >
        <DialogContent className="max-w-3xl rounded-3xl border-pink-200 p-2 bg-black/90">
          <DialogHeader className="sr-only">
            <DialogTitle>Practice Attachment Lightbox</DialogTitle>
          </DialogHeader>
          {lightboxUrl && (
            <div className="flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxUrl}
                alt="Practice Photo"
                className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeacherChatCard({
  video,
  onDeleteClick,
  onImageClick,
  onCommentSaved,
}: {
  video: PracticeVideoItem;
  onDeleteClick: () => void;
  onImageClick: (url: string) => void;
  onCommentSaved: () => void;
}) {
  const [comment, setComment] = React.useState(video.teacherComment ?? "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(!video.teacherComment);

  const parsed = parseVideoUrl(video.url);
  const isImage = isMediaImage(video.url);

  const updateCommentMutation = api.parent.updateVideoComment.useMutation({
    onSuccess: () => {
      setIsSaving(false);
      setIsEditing(false);
      toast.success("Feedback sent to parent portal!");
      if (!video.teacherComment && comment.trim()) {
        void confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
      onCommentSaved();
    },
    onError: (err) => {
      setIsSaving(false);
      toast.error(err.message ?? "Failed to save feedback");
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    updateCommentMutation.mutate({
      videoId: video.id,
      teacherComment: comment.trim() || null,
    });
  };

  return (
    <div className="rounded-2xl border border-pink-200/90 bg-white/95 p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm">
      {/* Sender Header */}
      <div className="flex items-center justify-between gap-2 border-b border-pink-100 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="size-10 border border-pink-200 shadow-2xs">
            <AvatarImage src={video.student.avatar ?? ""} />
            <AvatarFallback className="bg-pink-100 text-xs font-bold text-pink-700">
              {getInitials(video.student.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-ink truncate">
                {video.student.name}
              </span>
              <span className="text-[11px] text-ink-soft">
                (via {video.postedBy?.name ?? "Parent"})
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-ink-soft">
              <span>{formatMessageTime(video.createdAt)}</span>
              <span>·</span>
              <Badge className="bg-pink-50 text-pink-700 border-pink-200 text-[10px] px-1.5 py-0">
                {video.provider}
              </Badge>
            </div>
          </div>
        </div>

        {/* Delete Post Button for Teacher */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDeleteClick}
          className="size-8 rounded-full text-pink-400 hover:text-rose-600 hover:bg-rose-50 p-0"
          title="Remove parent post from studio"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Content: Title & Notes */}
      <div className="mt-3">
        <h4 className="font-semibold text-base text-ink">{video.title}</h4>
        {video.note && (
          <p className="mt-1 text-xs text-ink-soft italic leading-relaxed bg-pink-50/40 rounded-xl p-2.5 border border-pink-100/60">
            &ldquo;{video.note}&rdquo;
          </p>
        )}
      </div>

      {/* Media Player / Image Display */}
      <div className="mt-3 overflow-hidden rounded-xl border border-pink-200/80 bg-black/5 flex items-center justify-center">
        {isImage ? (
          <div className="relative group cursor-pointer w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={video.url}
              alt={video.title}
              className="w-full max-h-96 object-contain bg-pink-50/20"
              onClick={() => onImageClick(video.url)}
            />
            <button
              type="button"
              onClick={() => onImageClick(video.url)}
              className="absolute bottom-2 right-2 rounded-full bg-black/60 text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Zoom Image"
            >
              <ZoomIn className="size-4" />
            </button>
          </div>
        ) : parsed.provider === "YOUTUBE" && parsed.embedUrl ? (
          <div className="aspect-video w-full">
            <iframe
              src={parsed.embedUrl}
              title={video.title}
              className="size-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : parsed.provider === "DRIVE" && parsed.embedUrl ? (
          <div className="aspect-video w-full">
            <iframe
              src={parsed.embedUrl}
              title={video.title}
              className="size-full border-0"
              allow="autoplay"
              allowFullScreen
            />
          </div>
        ) : parsed.provider === "CLOUDINARY" ? (
          <video
            src={video.url}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-96 object-contain bg-black"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
            <Play className="size-8 text-pink-500" />
            <p className="text-xs text-ink-soft max-w-xs truncate">
              {video.url}
            </p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
            >
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5"
              >
                Watch Video in New Tab
                <ExternalLink className="size-3" />
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Teacher Feedback Reply Bubble (WhatsApp / Zalo reply quote style) */}
      <div className="mt-4 rounded-2xl border-l-4 border-pink-500 bg-pink-50/70 p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-pink-800">
            <Sparkles className="size-3.5 text-pink-600" />
            <span>Your Teacher Feedback (Seen by Parent)</span>
          </div>

          {video.teacherComment && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-[11px] font-semibold text-pink-700 hover:underline"
            >
              Edit Feedback
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2 pt-1">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write encouraging feedback on posture, rhythm, tempo, dynamics..."
              className="min-h-20 resize-none rounded-xl border-pink-200 bg-white text-xs focus-visible:ring-pink-400"
            />
            <div className="flex justify-end gap-2">
              {video.teacherComment && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-xs h-7"
                  onClick={() => {
                    setComment(video.teacherComment ?? "");
                    setIsEditing(false);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                className="rounded-full [background-image:var(--grad-pink)] text-white text-xs h-7 px-4 shadow-(--sh-pink)"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Send className="mr-1.5 size-3" />
                {isSaving ? "Saving..." : "Send Feedback 🌸"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink leading-relaxed">
            {video.teacherComment}
          </p>
        )}
      </div>
    </div>
  );
}
