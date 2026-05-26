import React, { useState } from "react";
import { ActionModal } from "@/modules/shared/component/ActionModal/actionModal";
import { IconButton } from "@mui/material";
import { MoreHoriz } from "@mui/icons-material";

const useAssessmentResult = () => {
  const assessmentResultHeader = ["Name", "Score", "Grade", "Action"];
  const [isEdit, setIsEdit] = useState(false);

  const result = [
    {
      id: "1",
      name: "Amina Usman",
      score: 10,
      grade: "C",
    },
    {
      id: "2",
      name: "Amina Usman",
      score: 10,
      grade: "C",
    },
    {
      id: "3",
      name: "Amina Usman",
      score: 10,
      grade: "C",
    },
    {
      id: "4",
      name: "Amina Usman",
      score: 10,
      grade: "C",
    },
    {
      id: "5",
      name: "Amina Usman",
      score: 10,
      grade: "C",
    },
  ];

  const assessmentResultTableData = result?.map((data) => ({
    Name: data.name,
    Score: data.score,
    Grade: data.grade,
    Action: (
      <ActionModal
        actions={[
          {
            label: "Edit",
            onClick: () => {
              setIsEdit(true);
            },
          },
        ]}
        classNames="items-center !gap-0 !p-1 !cursor-pointer"
        customModalclassNames="!cursor-pointer !px-0.5 !py-1"
        width={140}
        Iconcomponent={({ onClick, ref }) => (
          <IconButton ref={ref} onClick={onClick} size="small">
            <MoreHoriz />
          </IconButton>
        )}
      />
    ),
  }));

  return {
    assessmentResultHeader,
    assessmentResultTableData,
    isEdit,
    setIsEdit,
  };
};

export default useAssessmentResult;
