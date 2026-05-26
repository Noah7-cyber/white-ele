"use client";

import { useState } from "react";
import Image from "next/image";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useImageLibrary, type ImageLibraryTab } from "./hooks/useImageLibrary";
import { Modal } from "@/modules/shared/component/modal";

export const ImageLibraryPage = () => {
  const [tab, setTab] = useState<ImageLibraryTab>("photos");
  const { photos, videos, isLoading } = useImageLibrary();
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId) ?? null;
  const selectedVideo = videos.find((video) => video.id === selectedVideoId) ?? null;

  const closePreviewModal = () => {
    setSelectedPhotoId(null);
    setSelectedVideoId(null);
  };

  return (
    <Box className="flex flex-col gap-3 md:gap-4 p-3 sm:p-4 md:p-5 h-full">
      <Typography className="hidden md:block !text-xl !font-semibold !text-[#022F2F]">Image Library</Typography>

      <Box className="flex gap-5 sm:gap-8 border-b border-[#E4E7EC] overflow-x-auto">
        <button
          type="button"
          onClick={() => setTab("photos")}
          className={`relative pb-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
            tab === "photos"
              ? "border-brandColor-active text-brandColor-active"
              : "border-transparent text-grey-5 hover:text-gray-700"
          }`}
        >
          Photos
        </button>
        <button
          type="button"
          onClick={() => setTab("videos")}
          className={`relative pb-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
            tab === "videos"
              ? "border-brandColor-active text-brandColor-active"
              : "border-transparent text-grey-5 hover:text-gray-700"
          }`}
        >
          Videos
        </button>
      </Box>

      <Box className="rounded-lg border border-brandColor-active/20 bg-white p-2.5 sm:p-3 md:p-5 flex-1 min-h-[280px]">
        {isLoading ? (
          <Box className="flex justify-center py-16">
            <CircularProgress size={36} />
          </Box>
        ) : tab === "photos" ? (
          photos.length === 0 ? (
            <Typography className="text-sm text-grey-5 text-center py-12">
              No photos yet. When your school shares images, they will appear here.
            </Typography>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4 list-none p-0 m-0">
              {photos.map((item) => (
                <li
                  key={item.id}
                  className="aspect-square relative rounded-xl overflow-hidden bg-[#F8F9FA]"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoId(item.id)}
                    className="absolute inset-0 cursor-pointer"
                  >
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : videos.length === 0 ? (
          <Typography className="text-sm text-grey-5 text-center py-12">
            No videos yet. When your school shares videos, they will appear here.
          </Typography>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4 list-none p-0 m-0">
            {videos.map((item) => (
              <li key={item.id} className="flex flex-col gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedVideoId(item.id)}
                  className="aspect-square relative rounded-xl overflow-hidden bg-black cursor-pointer"
                >
                  <video
                    className="h-full w-full object-cover pointer-events-none"
                    playsInline
                    preload="metadata"
                    poster={item.poster}
                    src={item.src}
                    aria-label={item.title}
                  />
                </button>
                <Typography className="!text-xs !text-grey-5 !font-medium break-words leading-4 px-0.5">
                  {item.title}
                </Typography>
              </li>
            ))}
          </ul>
        )}
      </Box>

      <Modal
        isOpen={Boolean(selectedPhoto || selectedVideo)}
        onClose={closePreviewModal}
        width="min(92vw, 900px)"
        className="!rounded-2xl !bg-black p-0 overflow-hidden"
      >
        <Box className="relative w-full">
          <button
            type="button"
            aria-label="Close preview"
            onClick={closePreviewModal}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 text-white text-lg leading-none cursor-pointer"
          >
            ×
          </button>

          {selectedPhoto ? (
            <Box className="relative w-full h-[75vh]">
              <Image
                src={selectedPhoto.src}
                alt={selectedPhoto.alt}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </Box>
          ) : selectedVideo ? (
            <Box className="w-full bg-black max-h-[75vh]">
              <video
                className="w-full max-h-[75vh]"
                controls
                autoPlay
                playsInline
                preload="metadata"
                poster={selectedVideo.poster}
                src={selectedVideo.src}
                aria-label={selectedVideo.title}
              />
            </Box>
          ) : null}
        </Box>
      </Modal>
    </Box>
  );
};
