"use client";

import { ReusableButton } from "@/modules/shared/component/CustomButton";
import { DashboardRoutes } from "@/routes/dashboard.routes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ScrollableTabBar from "./ScrollableTabBar";

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "parent", label: "Parent" },
  { id: "documents", label: "Documents" },
];

export default function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="w-full mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <ReusableButton
          label="Back to Children"
          variant="neutral"
          size="sm"
          className="!rounded-full !px-2 cursor-pointer flex !items-center !justify-center"
          onClick={() => router.push(`${DashboardRoutes.children}`)}
          leftIcon={<ArrowBackIcon fontSize="inherit" />}
        />

        <ReusableButton
          label="Edit Profile"
          variant="primary"
          size="sm"
          className="!rounded-full"
        />
      </div>

      {/* Tabs */}
      <div className="p-4 mx-4 bg-white rounded-2xl overflow-hidden">
        <ScrollableTabBar innerClassName="flex flex-nowrap items-center gap-2 min-w-min">
          {tabs.map((tab) => {
            const href = `${DashboardRoutes.children}/${params.id}${tab.id ? `/${tab.id}` : ""}`;
            const isActive = pathname === href;

            return (
              <Link
                key={tab.id || "profile"}
                href={href}
                className={`shrink-0 whitespace-nowrap px-6 py-3 rounded-full text-sm font-light font-avenir transition-colors ${
                  isActive
                    ? "text-white bg-teal-600 hover:bg-teal-700"
                    : "text-teal-600 bg-profile-gray hover:text-teal-700"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </ScrollableTabBar>
      </div>

      {/* Content */}
      <div className="p-6">{children}</div>
    </div>
  );
}
