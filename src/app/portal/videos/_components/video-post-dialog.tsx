"use client";

import * as React from "react";
import {
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Upload,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { Blossom } from "@/components/blossom/blossom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { isUploadConfigured, uploadPracticeMedia } from "@/lib/cloudinary";
import { isMediaImage, parseVideoUrl } from "@/lib/practice-video";
import { api } from "@/trpc/react";

interface VideoPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childrenList: { id: string; name: string; avatar: string | null }[];
  onVideoPosted: () => void;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export function VideoPostDialog({
  open,
  onOpenChange,
  childrenList,
  onVideoPosted,
}: VideoPostDialogProps) {
  const [userSelectedChildId, setUserSelectedChildId] =
    React.useState<string>("");
  const selectedChildId =
    userSelectedChildId.length > 0
      ? userSelectedChildId
      : (childrenList[0]?.id ?? "");
  const [title, setTitle] = React.useState("");
  const [note, setNote] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");

  // Upload state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadPercent, setUploadPercent] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState<boolean>(false);

  const [activeTab, setActiveTab] = React.useState<"link" | "upload">("upload");
  const uploadEnabled = isUploadConfigured();

  const addVideoMutation = api.portal.addVideo.useMutation({
    onSuccess: () => {
      toast.success("Practice milestone shared successfully!");
      handleReset();
      onOpenChange(false);
      onVideoPosted();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to share practice post");
    },
  });

  const handleReset = () => {
    setTitle("");
    setNote("");
    setLinkUrl("");
    setSelectedFile(null);
    setUploadPercent(0);
    setIsUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      toast.error("Please select a video (MP4, MOV, WebM) or photo (JPG, PNG)");
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      toast.error("File size cannot exceed 150MB");
      return;
    }

    setSelectedFile(file);
    if (!title.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ");
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChildId) {
      toast.error("Please select a student");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title (e.g. Minuet in G practice)");
      return;
    }

    let finalMediaUrl = "";

    if (activeTab === "upload") {
      if (!selectedFile) {
        toast.error("Please choose a video or image file to upload");
        return;
      }

      setIsUploading(true);
      setUploadPercent(0);

      try {
        const uploadRes = await uploadPracticeMedia(selectedFile, {
          studentId: selectedChildId,
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
    } else {
      if (!linkUrl.trim()) {
        toast.error("Please paste a video or photo URL");
        return;
      }
      finalMediaUrl = linkUrl.trim();
    }

    addVideoMutation.mutate({
      studentId: selectedChildId,
      title: title.trim(),
      note: note.trim() || undefined,
      url: finalMediaUrl,
    });
  };

  const isPending = isUploading || addVideoMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-pink-200">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Blossom size={18} className="text-bubblegum" />
            <DialogTitle className="font-serif text-xl font-normal text-ink">
              Share Practice Video or Photo
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-ink-soft">
            Share home recordings or practice photos with your teacher and studio
            community for feedback and encouragement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Child Selector */}
          {childrenList.length > 1 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-ink font-semibold">
                Select Child
              </Label>
              <Select
                value={selectedChildId}
                onValueChange={setUserSelectedChildId}
              >
                <SelectTrigger className="h-10 rounded-2xl border-pink-200 text-xs">
                  <SelectValue placeholder="Pick a student" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-pink-200">
                  {childrenList.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-4">
                          <AvatarImage src={c.avatar ?? ""} />
                          <AvatarFallback className="text-[8px]">
                            {getInitials(c.name)}
                          </AvatarFallback>
                        </Avatar>
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="video-title" className="text-xs text-ink font-semibold">
              Title / Piece Name
            </Label>
            <Input
              id="video-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Für Elise (Section A practice)"
              className="h-10 rounded-2xl border-pink-200 text-xs focus-visible:ring-pink-400"
              required
            />
          </div>

          {/* Upload Method Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "link" | "upload")}
          >
            <TabsList className="grid grid-cols-2 rounded-2xl p-1 bg-pink-100/60">
              <TabsTrigger
                value="upload"
                className="rounded-xl text-xs data-[state=active]:bg-white data-[state=active]:text-pink-800"
              >
                <Upload className="mr-1.5 size-3.5" />
                Upload File (Video / Photo)
              </TabsTrigger>
              <TabsTrigger
                value="link"
                className="rounded-xl text-xs data-[state=active]:bg-white data-[state=active]:text-pink-800"
              >
                <LinkIcon className="mr-1.5 size-3.5" />
                YouTube / Drive Link
              </TabsTrigger>
            </TabsList>

            {/* Direct Upload Tab */}
            <TabsContent value="upload" className="space-y-3 pt-2">
              <div
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                  selectedFile
                    ? "border-pink-400 bg-pink-50/50"
                    : "border-pink-200 bg-card/60 hover:border-pink-300"
                }`}
              >
                <input
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 size-full opacity-0 cursor-pointer"
                  disabled={isPending}
                />

                {selectedFile ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2 text-pink-700 font-semibold text-xs">
                      {selectedFile.type.startsWith("image/") ? (
                        <ImageIcon className="size-4" />
                      ) : (
                        <Video className="size-4" />
                      )}
                      <span>{selectedFile.name}</span>
                    </div>
                    <p className="text-[11px] text-ink-soft">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB · Click
                      to replace
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="mx-auto grid size-10 place-items-center rounded-full bg-pink-100 text-pink-700">
                      <Upload className="size-5" />
                    </div>
                    <p className="text-xs font-medium text-ink">
                      Drop video or photo here, or click to browse
                    </p>
                    <p className="text-[10px] text-ink-soft">
                      Supports MP4, MOV, WebM, JPG, PNG up to 150MB
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-pink-700">
                    <span>Uploading media...</span>
                    <span>{uploadPercent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-pink-100">
                    <div
                      className="h-full bg-pink-600 transition-all duration-200"
                      style={{ width: `${uploadPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Video Link Tab */}
            <TabsContent value="link" className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="video-url" className="text-xs text-ink font-semibold">
                  Video or Media URL
                </Label>
                <Input
                  id="video-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://youtu.be/... or Google Drive link"
                  className="h-10 rounded-2xl border-pink-200 text-xs focus-visible:ring-pink-400"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Student Note */}
          <div className="space-y-1.5">
            <Label htmlFor="video-note" className="text-xs text-ink font-semibold">
              Notes or Questions for Teacher (Optional)
            </Label>
            <Textarea
              id="video-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Having a bit of trouble with the left-hand fingering in bar 12..."
              className="h-20 resize-none rounded-2xl border-pink-200 text-xs focus-visible:ring-pink-400"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-pink-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-xs"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              size="sm"
              className="rounded-full [background-image:var(--grad-pink)] text-white text-xs shadow-(--sh-pink)"
            >
              {isPending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              {isUploading
                ? `Uploading (${uploadPercent}%)`
                : addVideoMutation.isPending
                  ? "Posting..."
                  : "Share Milestone"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
