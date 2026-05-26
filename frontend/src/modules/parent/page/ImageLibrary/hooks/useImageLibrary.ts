/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { parentServices } from "@/services/parent.service";
import { useQueryService } from "@/utils/hooks/useQueryService";

export type ImageLibraryTab = "photos" | "videos";

export interface ParentLibraryPhoto {
  id: string;
  src: string;
  alt: string;
  childName?: string;
  category?: string;
}

export interface ParentLibraryVideo {
  id: string;
  src: string;
  poster: string;
  title: string;
  childName?: string;
  category?: string;
}

type ParentImageGalleryCategory = "studentProfile" | "classroomActivity" | "portfolio";

interface ParentImageGalleryChild {
  id: number;
  name: string;
  photoUrl: string;
  images?: Partial<Record<ParentImageGalleryCategory, string[]>>;
}

interface ParentImageGalleryResponse {
  success: boolean;
  data?: {
    success?: boolean;
    message?: string;
    children?: ParentImageGalleryChild[];
  };
}

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m3u8", ".avi", ".mkv"];
const IMAGE_FALLBACK_POSTER =
  "https://storage.googleapis.com/heimdall-projects.firebasestorage.app/profiles/default-avatar.png";

const CATEGORY_LABELS: Record<ParentImageGalleryCategory, string> = {
  studentProfile: "Student Profile",
  classroomActivity: "Classroom Activity",
  portfolio: "Portfolio",
};

const getCategoryLabel = (category: ParentImageGalleryCategory) => CATEGORY_LABELS[category];

const isVideoUrl = (url: string) => {
  const cleanUrl = url.split("?")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => cleanUrl.endsWith(ext));
};

export function useImageLibrary() {
  const { data, isLoading } = useQueryService<any, ParentImageGalleryResponse>({
    service: parentServices.getImageGallery,
    options: {
      keys: ["parentImageGallery"],
      refetchInterval: false,
      refetchOnWindowFocus: false,
    },
  });

  const children = useMemo(() => data?.data?.children ?? [], [data?.data?.children]);

  const photos: ParentLibraryPhoto[] = useMemo(() => {
    const mapped: ParentLibraryPhoto[] = [];

    children.forEach((child) => {
      const categories = child.images ?? {};
      (Object.keys(categories) as ParentImageGalleryCategory[]).forEach((category) => {
        const urls = categories[category] ?? [];
        urls.forEach((url, index) => {
          if (!url || isVideoUrl(url)) return;
          mapped.push({
            id: `photo-${child.id}-${category}-${index}`,
            src: url,
            alt: `${child.name} - ${getCategoryLabel(category)}`,
            childName: child.name,
            category: getCategoryLabel(category),
          });
        });
      });
    });

    return mapped;
  }, [children]);

  const videos = useMemo(() => {
    const mapped: ParentLibraryVideo[] = [];

    children.forEach((child) => {
      const categories = child.images ?? {};
      (Object.keys(categories) as ParentImageGalleryCategory[]).forEach((category) => {
        const urls = categories[category] ?? [];
        urls.forEach((url, index) => {
          if (!url || !isVideoUrl(url)) return;
          mapped.push({
            id: `video-${child.id}-${category}-${index}`,
            src: url,
            poster: child.photoUrl || IMAGE_FALLBACK_POSTER,
            title: `${child.name} - ${getCategoryLabel(category)}`,
            childName: child.name,
            category: getCategoryLabel(category),
          });
        });
      });
    });

    return mapped;
  }, [children]);

  return {
    photos,
    videos,
    isLoading,
  };
}
