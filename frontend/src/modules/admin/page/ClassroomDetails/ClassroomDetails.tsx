"use client";

import { Table } from "@/modules/shared/component/Table";
// import Pagination from "@/components/Pagination/Pagination";
import { InsightCard } from "@/components/InsightCard";
import { MobileChildrenCard } from "@/modules/shared/component/ChildrenPageComponent/MobileChildrenCard";
import { Box, ButtonBase, IconButton } from "@mui/material";
import ListIcon from "@/modules/shared/assets/svgs/list-icon.svg";
import GridIcon from "@/modules/shared/assets/svgs/grid-icon.svg";
import ArrowLeft from "@/modules/shared/assets/svgs/arrow-left.svg";
import { useRouter } from "next/navigation";

const enrolledChildren = [
  { name: "Emma Johnson", age: "4 years", enrolled: "06/12/2024" },
  { name: "Liam Smith", age: "3 years", enrolled: "05/08/2024" },
  { name: "Sophia Davis", age: "4 years", enrolled: "01/02/2024" },
  { name: "Noah Brown", age: "2 years", enrolled: "03/20/2024" },
];

export function ClassroomDetails() {
  const router = useRouter();
  return (
    <div className="h-full p-3 space-y-6">
      <ButtonBase
        onClick={router.back}
        className="!flex items-center gap-0.5 !px-4 !py-1 !bg-white !rounded-full"
      >
        <ArrowLeft />
        <span>Back to Classrooms</span>
      </ButtonBase>

      <div className="bg-white py-5 px-3 mt-4">
        <h1 className="text-xl font-semibold">Little Explorers</h1>
        <p className="text-sm text-gray-500">Ages: 2–3 years • Capacity: 15</p>
      </div>

      <div className="flex overflow-x-auto gap-4 hide-scrollbar snap-x md:grid md:grid-cols-4 pb-2">
        <InsightCard name="Enrollment" value={"12/15"} />
        <InsightCard name="Staff Assigned" value={2} />
        <InsightCard name="Staff to Child Ratio" value={"1:6"} />
        <InsightCard name="Status" value={"Active"} />
      </div>

      <div className="bg-white rounded-2xl overflow-hidden px-4 py-4 flex-1">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="!text-lg !font-medium">Enrolled Children</h2>

          <div className="flex items-center gap-4">
            <Box className="flex items-center gap-1">
              <IconButton className="!bg-[#FEB92B]">
                <ListIcon />
              </IconButton>
              <IconButton className="!bg-[#FEB92B]">
                <GridIcon />
              </IconButton>
            </Box>
          </div>
        </div>

        <div className="hidden md:block">
          <Table
            headers={["Name", "Age", "Enrolled"]}
            tableData={enrolledChildren.map((child) => ({
              Name: child.name,
              Age: child.age,
              Enrolled: child.enrolled,
            }))}
          />
        </div>
        <div className="md:hidden flex flex-col gap-3 mt-4">
          {enrolledChildren.map((child, idx) => (
            <MobileChildrenCard
              key={idx}
              id={idx}
              name={child.name}
              age={child.age}
              status="active"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
