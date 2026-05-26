"use client";

import { Box, CircularProgress } from "@mui/material";
import ProfilePage from "@/components/ProfilePage/profilePage";
import { useParams } from "next/navigation";
import { useChildDetail } from "@/modules/parent/component/ChildDetailComponent/hooks/useChildDetail";

export default function ChildProfilePage() {
  const { id } = useParams() as { id: string };
  const { profileData, loading } = useChildDetail(id);

  if (loading) {
    return (
      <Box className="p-8 flex items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  return <ProfilePage childData={profileData} />;
}
