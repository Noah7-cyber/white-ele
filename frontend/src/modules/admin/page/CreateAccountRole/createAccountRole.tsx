"use client";

import { AuthRoutes } from "@/routes/auth.routes";
import { Typography, Card, CardActionArea, CardContent, Box } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CreateAccountRole = () => {
  type OnboardingRole = "admin" | "parent";
  const router = useRouter();

  const roleCards: { label: string; description: string; role: OnboardingRole }[] = [
    {
      label: "Admin",
      description: "Manage classroom activities.",
      role: "admin",
    },
    {
      label: "Parent",
      description: "Stay updated on your child's progress.",
      role: "parent",
    },
  ];

  const handleSelectRole = (role: OnboardingRole) => {
    router.push(`/auth/register?role=${role}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 0.5, sm: 2 },
      }}
    >
      <Box
        sx={{
          maxWidth: 900,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: { xs: 2.5, sm: 6 },
          gap: { xs: 3, sm: 4 },
          alignItems: "center",
          backgroundColor: "white",
          borderRadius: 3,
        }}
      >
        <Box textAlign="center">
          <Typography className="!font-bold !text-secondary-text-gray mb-2 !text-2xl">
            What describes you best?
          </Typography>
          <Typography className="!text-secondary-text-gray !font-normal !text-sm">
            Select your role to continue.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            width: "100%",
          }}
        >
          <Card
            key={roleCards[0].role}
            sx={{
              borderRadius: 3,
            }}
            className="border border-brandColor-active/20 !shadow-none !w-full rounded-2xl"
          >
            <CardActionArea onClick={() => handleSelectRole(roleCards[0].role)}>
              <CardContent
                sx={{ py: 3, px: 3 }}
                className="!min-h-[132px] sm:!min-h-[150px] !w-full flex items-center justify-center"
              >
                <Box className="flex flex-col gap-2 items-center justify-center">
                  <Typography className="!font-semibold !text-primary-dark mb-1 uppercase !text-2xl">
                    {roleCards[0].label}
                  </Typography>
                  <Typography className="!text-text-tertiary/70 text-center !text-sm">
                    {roleCards[0].description}
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              mx: 1,
              my: { xs: 0.5, md: 0 },
            }}
            className="!text-brandColor-active !font-semibold !text-xl md:!text-2xl"
          >
            or
          </Box>

          <Card
            key={roleCards[1].role}
            sx={{
              borderRadius: 3,
            }}
            className="border border-brandColor-active/20 !shadow-none !w-full"
          >
            <CardActionArea onClick={() => handleSelectRole(roleCards[1].role)}>
              <CardContent
                sx={{ py: 3, px: 3 }}
                className="!min-h-[132px] sm:!min-h-[150px] !w-full flex items-center justify-center"
              >
                <Box className="flex flex-col gap-2 items-center justify-center">
                  <Typography className="!font-semibold !text-primary-dark mb-1 uppercase !text-2xl">
                    {roleCards[1].label}
                  </Typography>
                  <Typography className="!text-text-tertiary/70 text-center !text-sm">
                    {roleCards[1].description}
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
        <Box className="flex justify-center">
          <Link href={AuthRoutes.selectRole} className="!text-xs text-text-gray">
            Already have an account?{" "}
            <span className="!text-brandColor-active !font-semibold hover:underline">Login</span>
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateAccountRole;
