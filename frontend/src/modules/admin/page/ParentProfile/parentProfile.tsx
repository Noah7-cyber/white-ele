/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataRenderer } from "@/modules/shared/component/DataRenderer";
import { Box } from "@mui/material";
import { FC } from "react";
import { getAge } from "@/utils/helper"
import InitialsAvatar from "@/modules/shared/component/InitialsAvatar/InitialsAvatar";

interface ParentProfileProps {
  parentData: any;
  isLoading?: boolean;
}

export const ParentProfile: FC<ParentProfileProps> = ({ isLoading, parentData }) => {
  return (
    <Box className="w-full min-h-0 space-y-4 md:space-y-6">
     <DataRenderer isLoading={isLoading}>
      {
        () => (
          <>
           <div className="bg-white rounded-none md:rounded-md border-0 md:border md:border-brandColor-active/20 p-5 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 md:mb-6">
        <Info title="Email" value={parentData?.user?.email} />
        <Info title="Phone Number" value={parentData?.user?.phone} />
        <Info title="Relationship" value={parentData?.relationship} />
        <Info title="No. of Children" value={parentData?.children?.length} />
      </div>

      {/* Children */}
      <div className="bg-white rounded-none md:rounded-md border-0 md:border md:border-brandColor-active/20 p-5 md:p-6">
        <h2 className="font-semibold text-primary-dark mb-4">Children</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parentData?.children?.map((child: any) => (
            <div
              key={child?.id}
              className="flex items-center gap-4 border border-[#00808033] rounded-xl p-4"
            >
              <InitialsAvatar
                src={child?.photoUrl}
                name={`${child?.user?.firstName ?? ""} ${child?.user?.lastName ?? ""}`}
                className="w-10 h-10"
                initialsClassName="text-sm"
              />
              <div>
                <p className="font-medium">{`${child?.user?.firstName} ${child?.user?.lastName}`}</p>
                <p className="text-xs text-gray-500">{child?.admissionNumber}</p>
                <p className="text-sm mt-1">{child?.classroom?.classroomName || "-"}</p>
                <p className="text-xs text-gray-500">{getAge(child?.user?.dateOfBirth) || "-"} years</p>
              </div>
            </div>
          ))}
        </div>
      </div>
          </>
        )
      }
     </DataRenderer>
    </Box>
  );
};

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{title}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
