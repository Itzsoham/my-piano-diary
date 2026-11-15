"use client";

import * as React from "react";
import {
  Camera,
  Check,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Paperclip,
  Play,
  Send,
  Sparkles,
  Trash2,
  Users,
  Video,
  X,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";

import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { AppLoader } from "@/components/ui/app-loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { isUploadConfigured, uploadPracticeMedia } from "@/lib/cloudinary";
import { isMediaImage, parseVideoUrl } from "@/lib/practice-video";
import { api, type RouterOutputs } from "@/trpc/react";
import { VideoPostDialog } from "./video-post-dialog";

type PracticeVideoItem = RouterOutputs["portal"]["videos"][number];

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

export function PortalVideosView() {
  const utils = api.useUtils();
  const { data: videos = [], isLoading: isVideosLoading } =
    api.portal.videos.useQuery();
  const { data: overview, isLoading: isOverviewLoading } =
    api.portal.overview.useQuery();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [filterMode, setFilterMode] = React.useState<"all" | "own">("all");
  const [selectedChildFilter, setSelectedChildFilter] =
    React.useState<string>("all");
  const [deleteTarget, setDeleteTarget] =
    React.useState<PracticeVideoItem | null>(null);

  // Lightbox preview for photos
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);

  // WhatsApp/Zalo-style Bottom Chat Bar state
  const [bottomText, setBottomText] = React.useState("");
  const [bottomNote, setBottomNote] = React.useState("");
  const [showNoteField, setShowNoteField] = React.useState(false);
  const [selectedChildId, setSelectedChildId] = React.useState<string>("");
  const [attachedFile, setAttachedFile] = React.useState<File | null>(null);
  const [attachedLink, setAttachedLink] = React.useState<string>("");
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = React.useState(false);
  const [tempLinkInput, setTempLinkInput] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadPercent, setUploadPercent] = React.useState(0);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const childrenList =
    overview?.children.map((c) => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
    })) ?? [];

  const activePostChildId =
    selectedChildId || (childrenList[0]?.id ?? "");

  const activePostChild = childrenList.find((c) => c.id === activePostChildId);

  const deleteMutation = api.portal.deleteVideo.useMutation({
    onSuccess: () => {
      toast.success("Practice post removed");
      setDeleteTarget(null);
      void utils.portal.videos.invalidate();
      void utils.portal.overview.invalidate();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to delete post");
    },
  });

  const addVideoMutation = api.portal.addVideo.useMutation({
    onSuccess: () => {
      toast.success("Practice milestone shared!");
      setBottomText("");
      setBottomNote("");
      setShowNoteField(false);
      setAttachedFile(null);
      setAttachedLink("");
      setIsUploading(false);
      setUploadPercent(0);
      void utils.portal.videos.invalidate();
      void utils.portal.overview.invalidate();
    },
    onError: (err) => {
      setIsUploading(false);
      toast.error(err.message ?? "Failed to post practice update");
    },
  });

  // Filtered posts
  const filteredVideos = React.useMemo(() => {
    return videos.filter((v) => {
      if (filterMode === "own" && !v.isOwnChild) return false;
      if (selectedChildFilter !== "all" && v.student.id !== selectedChildFilter)
        return false;
      return true;
    });
  }, [videos, filterMode, selectedChildFilter]);

  // Group by date string (e.g. "Today", "Yesterday", "Nov 12, 2026")
  const groupedVideos = React.useMemo(() => {
    const groups: { dateKey: string; items: PracticeVideoItem[] }[] = [];
    const map = new Map<string, PracticeVideoItem[]>();

    for (const v of filteredVideos) {
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
  }, [filteredVideos]);

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      toast.error("Please pick a video (MP4, MOV) or photo (JPG, PNG)");
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      toast.error("File size cannot exceed 150MB");
      return;
    }

    setAttachedFile(file);
    setAttachedLink(""); // clear link if file selected
    if (!bottomText.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ");
      setBottomText(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleApplyLink = () => {
    if (!tempLinkInput.trim()) {
      toast.error("Please paste a link URL");
      return;
    }
    setAttachedLink(tempLinkInput.trim());
    setAttachedFile(null); // clear file if link attached
    if (!bottomText.trim()) {
      setBottomText("Practice piece recording");
    }
    setTempLinkInput("");
    setIsLinkPopoverOpen(false);
  };

  const handleSendPost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activePostChildId) {
      toast.error("Please select a student");
      return;
    }

    if (!bottomText.trim()) {
      toast.error("Please enter a title (e.g. Minuet in G practice)");
      return;
    }

    let finalMediaUrl = "";

    if (attachedFile) {
      setIsUploading(true);
      setUploadPercent(0);

      try {
        const uploadRes = await uploadPracticeMedia(attachedFile, {
          studentId: activePostChildId,
          onProgress: (p) => setUploadPercent(p),
        });
        finalMediaUrl = uploadRes.secure_url;
      } catch (err: unknown) {
        setIsUploading(false);
        const msg =
          err instanceof Error
            ? err.message
            : "Media upload to Cloudinary failed";
        toast.error(msg);
        return;
      }
    } else if (attachedLink) {
      finalMediaUrl = attachedLink;
    } else {
      toast.error(
        "Please attach a video file, photo, or YouTube/Drive link using the attachment icon",
      );
      return;
    }

    addVideoMutation.mutate({
      studentId: activePostChildId,
      title: bottomText.trim(),
      note: bottomNote.trim() || undefined,
      url: finalMediaUrl,
    });
  };

  const ownVideosCount = videos.filter((v) => v.isOwnChild).length;
  const isLoading = isVideosLoading || isOverviewLoading;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-pink-700 uppercase tracking-wider">
            <Blossom size={14} className="text-bubblegum" />
            Studio Practice Room
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink mt-1">
            Community Practice Feed 💬
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed max-w-xl">
            A friendly WhatsApp/Zalo-style feed where parents share practice
            videos &amp; photos to motivate one another and receive personalized
            feedback from Teacher {overview?.teacher.name}.
          </p>
        </div>

        <Button
          onClick={() => setDialogOpen(true)}
          className="bday-animate-button rounded-full [background-image:var(--grad-pink)] text-white shadow-(--sh-pink) h-10 px-5 text-xs font-semibold self-start sm:self-auto"
        >
          <Camera className="mr-1.5 size-4" />
          Share New Milestone
        </Button>
      </div>

      {/* Community Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pink-100 pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={filterMode === "all" ? "default" : "outline"}
            size="sm"
            className="rounded-full text-xs h-8"
            onClick={() => {
              setFilterMode("all");
              setSelectedChildFilter("all");
            }}
          >
            <Users className="mr-1.5 size-3.5" />
            All Studio Posts ({videos.length})
          </Button>

          <Button
            variant={filterMode === "own" ? "default" : "outline"}
            size="sm"
            className="rounded-full text-xs h-8"
            onClick={() => setFilterMode("own")}
          >
            <Sparkles className="mr-1.5 size-3.5" />
            My Children Only ({ownVideosCount})
          </Button>
        </div>

        {/* Multi-child dropdown filter */}
        {childrenList.length > 1 && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-ink-soft">Filter Child:</span>
            <select
              value={selectedChildFilter}
              onChange={(e) => setSelectedChildFilter(e.target.value)}
              className="rounded-full border border-pink-200 bg-white px-2.5 py-1 text-xs text-ink focus:outline-pink-400"
            >
              <option value="all">All ({childrenList.length})</option>
              {childrenList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* WhatsApp / Zalo Chat Stream Container */}
      <div className="relative rounded-3xl border border-pink-200/90 bg-[linear-gradient(180deg,rgba(255,245,248,0.6),var(--surface)_85%)] p-4 sm:p-6 shadow-(--sh) min-h-[520px] flex flex-col justify-between">
        {/* Messages Stream */}
        <div className="space-y-6 pb-4 flex-1">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <AppLoader size="sm" text="Connecting to practice room..." />
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-pink-200 bg-card/70 px-6 py-14 text-center">
              <Mochi mood="content" size={100} />
              <div>
                <h3 className="font-serif text-base text-ink font-semibold">
                  No practice posts yet
                </h3>
                <p className="mt-1 max-w-sm text-xs text-ink-soft leading-relaxed">
                  Be the first to share your child&apos;s playing or a practice
                  photo using the input bar below!
                </p>
              </div>
            </div>
          ) : (
            groupedVideos.map((group) => (
              <div key={group.dateKey} className="space-y-4">
                {/* Date Separator Pill (WhatsApp / Zalo style) */}
                <div className="flex justify-center">
                  <span className="rounded-full bg-white/90 border border-pink-200/80 px-3 py-1 text-[11px] font-semibold text-pink-700 shadow-2xs">
                    {group.dateKey}
                  </span>
                </div>

                {/* Message Cards */}
                {group.items.map((video) => {
                  const isImage = isMediaImage(video.url);
                  const parsed = parseVideoUrl(video.url);
                  const isOwn = video.isOwnPost;
                  const isOwnChild = video.isOwnChild;

                  return (
                    <div
                      key={video.id}
                      className={`flex flex-col max-w-xl ${
                        isOwn ? "ml-auto items-end" : "mr-auto items-start"
                      }`}
                    >
                      {/* Sender Meta Bar */}
                      <div
                        className={`flex items-center gap-2 mb-1 px-1 text-[11px] ${
                          isOwn ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <Avatar className="size-6 border border-pink-200 shadow-2xs">
                          <AvatarImage src={video.student.avatar ?? ""} />
                          <AvatarFallback className="text-[9px] bg-pink-100 text-pink-700 font-bold">
                            {getInitials(video.student.name)}
                          </AvatarFallback>
                        </Avatar>

                        <span className="font-semibold text-ink">
                          {video.student.name}
                        </span>

                        {isOwnChild ? (
                          <Badge className="bg-pink-100 text-pink-800 border-transparent text-[9.5px] px-1.5 py-0">
                            Your Child
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-ink-soft">
                            (via {video.postedBy.name ?? "Parent"})
                          </span>
                        )}

                        <span className="text-[10px] text-ink-soft">
                          {formatMessageTime(video.createdAt)}
                        </span>
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl p-3 sm:p-4 shadow-xs transition-shadow w-full ${
                          isOwn
                            ? "bg-white border-2 border-pink-300 rounded-tr-none"
                            : "bg-white/95 border border-pink-200/80 rounded-tl-none"
                        }`}
                      >
                        {/* Title */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-sm text-ink leading-tight">
                            {video.title}
                          </h4>

                          {isOwn && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(video)}
                              className="text-pink-400 hover:text-rose-600 transition-colors p-1"
                              title="Delete practice post"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Media Display (Video or Image) */}
                        <div className="rounded-xl overflow-hidden bg-black/5 border border-pink-100 my-2">
                          {isImage ? (
                            <div className="relative group cursor-pointer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={video.url}
                                alt={video.title}
                                className="w-full max-h-80 object-contain bg-pink-50/20"
                                onClick={() => setLightboxUrl(video.url)}
                              />
                              <button
                                type="button"
                                onClick={() => setLightboxUrl(video.url)}
                                className="absolute bottom-2 right-2 rounded-full bg-black/60 text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Zoom Image"
                              >
                                <ZoomIn className="size-4" />
                              </button>
                            </div>
                          ) : parsed.provider === "YOUTUBE" &&
                            parsed.embedUrl ? (
                            <div className="aspect-video w-full">
                              <iframe
                                src={parsed.embedUrl}
                                title={video.title}
                                className="size-full border-0"
                                allowFullScreen
                              />
                            </div>
                          ) : parsed.provider === "DRIVE" &&
                            parsed.embedUrl ? (
                            <div className="aspect-video w-full">
                              <iframe
                                src={parsed.embedUrl}
                                title={video.title}
                                className="size-full border-0"
                                allowFullScreen
                              />
                            </div>
                          ) : parsed.provider === "CLOUDINARY" ? (
                            <video
                              src={video.url}
                              controls
                              className="w-full max-h-96 object-contain bg-black"
                              preload="metadata"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                              <Play className="size-8 text-pink-500" />
                              <a
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-pink-700 underline font-medium flex items-center gap-1"
                              >
                                Open Video Link <ExternalLink className="size-3" />
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Caption / Note */}
                        {video.note && (
                          <p className="text-xs text-ink-soft italic mt-2 leading-relaxed">
                            &ldquo;{video.note}&rdquo;
                          </p>
                        )}

                        {/* Teacher Feedback Reply Bubble (WhatsApp / Zalo reply quote style) */}
                        {video.teacherComment ? (
                          <div className="mt-3 rounded-xl border-l-4 border-pink-500 bg-pink-50/80 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-pink-800">
                              <Sparkles className="size-3.5 text-pink-600" />
                              <span>Teacher Feedback</span>
                            </div>
                            <p className="mt-1 text-xs text-ink leading-relaxed">
                              {video.teacherComment}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-ink-soft/80">
                            <Clock className="size-3 text-pink-400" />
                            <span>Awaiting teacher feedback</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* WhatsApp / Zalo Style Sticky Bottom Input Bar */}
        <div className="sticky bottom-0 pt-3 z-10">
          <form
            onSubmit={handleSendPost}
            className="rounded-3xl border border-pink-200/90 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 shadow-lg flex flex-col gap-2"
          >
            {/* Active Attachment Pill (if selected) */}
            {attachedFile && (
              <div className="flex items-center justify-between rounded-xl bg-pink-50 px-3 py-1.5 border border-pink-200 text-xs">
                <div className="flex items-center gap-2 text-pink-800 truncate">
                  {attachedFile.type.startsWith("image/") ? (
                    <ImageIcon className="size-4 text-pink-600 shrink-0" />
                  ) : (
                    <Video className="size-4 text-pink-600 shrink-0" />
                  )}
                  <span className="font-medium truncate">
                    {attachedFile.name} (
                    {(attachedFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-pink-400 hover:text-pink-700"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {attachedLink && (
              <div className="flex items-center justify-between rounded-xl bg-pink-50 px-3 py-1.5 border border-pink-200 text-xs">
                <div className="flex items-center gap-2 text-pink-800 truncate">
                  <LinkIcon className="size-4 text-pink-600 shrink-0" />
                  <span className="font-medium truncate">{attachedLink}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedLink("")}
                  className="text-pink-400 hover:text-pink-700"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {/* Live Upload Progress */}
            {isUploading && (
              <div className="space-y-1 px-1">
                <div className="flex justify-between text-[11px] font-semibold text-pink-700">
                  <span>Uploading to Cloudinary...</span>
                  <span>{uploadPercent}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-pink-100">
                  <div
                    className="h-full bg-pink-600 transition-all duration-200"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Optional Note Row */}
            {showNoteField && (
              <div className="px-1">
                <Input
                  value={bottomNote}
                  onChange={(e) => setBottomNote(e.target.value)}
                  placeholder="Add questions or practice details for teacher..."
                  className="h-8 rounded-xl border-pink-200 text-xs focus-visible:ring-pink-400"
                />
              </div>
            )}

            {/* Bottom Input Controls Bar */}
            <div className="flex items-center gap-2">
              {/* Child Picker Pill */}
              {childrenList.length > 1 ? (
                <select
                  value={activePostChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="rounded-full border border-pink-200 bg-pink-50/70 px-2.5 py-1.5 text-xs font-semibold text-pink-800 focus:outline-pink-400 shrink-0"
                >
                  {childrenList.map((c) => (
                    <option key={c.id} value={c.id}>
                      👧 {c.name}
                    </option>
                  ))}
                </select>
              ) : activePostChild ? (
                <div className="hidden sm:flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-800 shrink-0">
                  <span>👧 {activePostChild.name}</span>
                </div>
              ) : null}

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
                onChange={handleFilePicked}
                className="hidden"
              />

              {/* Attachment Button: Video / Photo */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="size-9 rounded-full text-pink-600 hover:bg-pink-100 hover:text-pink-800 shrink-0"
                title="Attach Video or Photo"
              >
                <Paperclip className="size-4" />
              </Button>

              {/* Attachment Button: Video Link Popover */}
              <Popover
                open={isLinkPopoverOpen}
                onOpenChange={setIsLinkPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-full text-pink-600 hover:bg-pink-100 hover:text-pink-800 shrink-0"
                    title="Paste YouTube or Google Drive Link"
                  >
                    <LinkIcon className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-72 rounded-2xl border-pink-200 p-3"
                  side="top"
                >
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-ink">
                      Paste Video Link
                    </p>
                    <Input
                      value={tempLinkInput}
                      onChange={(e) => setTempLinkInput(e.target.value)}
                      placeholder="https://youtu.be/... or Drive"
                      className="h-8 rounded-xl text-xs border-pink-200"
                    />
                    <div className="flex justify-end gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs rounded-full"
                        onClick={() => setIsLinkPopoverOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs rounded-full [background-image:var(--grad-pink)] text-white"
                        onClick={handleApplyLink}
                      >
                        Attach
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Text Input */}
              <Input
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                placeholder={
                  attachedFile || attachedLink
                    ? "Add a title (e.g. Minuet in G practice)..."
                    : "Attach a video or photo, then type piece title..."
                }
                className="h-10 rounded-full border-pink-200 text-xs focus-visible:ring-pink-400 flex-1"
              />

              {/* Toggle Note Input */}
              <button
                type="button"
                onClick={() => setShowNoteField((v) => !v)}
                className={`text-[11px] font-medium px-2 py-1 rounded-full transition-colors hidden sm:block ${
                  showNoteField
                    ? "bg-pink-100 text-pink-800"
                    : "text-ink-soft hover:text-pink-700"
                }`}
              >
                {showNoteField ? "- Note" : "+ Note"}
              </button>

              {/* Send Button */}
              <Button
                type="submit"
                disabled={
                  isUploading ||
                  addVideoMutation.isPending ||
                  !bottomText.trim() ||
                  (!attachedFile && !attachedLink)
                }
                className="size-10 rounded-full [background-image:var(--grad-pink)] text-white shadow-(--sh-pink) p-0 shrink-0 hover:scale-105 transition-transform"
                title="Send Practice Milestone"
              >
                {isUploading || addVideoMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4 ml-0.5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Practice Post"
        description={`Are you sure you want to remove "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText={deleteMutation.isPending ? "Deleting..." : "Delete Post"}
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate({ videoId: deleteTarget.id });
          }
        }}
      />

      {/* Full Size Image Lightbox Modal */}
      <Dialog
        open={Boolean(lightboxUrl)}
        onOpenChange={(open) => !open && setLightboxUrl(null)}
      >
        <DialogContent className="max-w-3xl rounded-3xl border-pink-200 p-2 bg-black/90">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Lightbox</DialogTitle>
          </DialogHeader>
          {lightboxUrl && (
            <div className="flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxUrl}
                alt="Practice Attachment"
                className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Alternative Full Post Dialog */}
      <VideoPostDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        childrenList={childrenList}
        onVideoPosted={() => {
          void utils.portal.videos.invalidate();
          void utils.portal.overview.invalidate();
        }}
      />
    </div>
  );
}
