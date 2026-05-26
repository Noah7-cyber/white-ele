"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface LearningFilterState {
  classroom: string;
  classroomId: string;
  status: string;
  period: string;
  startDate: string;
  endDate: string;
}

export interface LearningActionsContextValue {
  filterState: LearningFilterState;
  setFilterState: React.Dispatch<React.SetStateAction<LearningFilterState>>;
  milestoneActions: {
    openAdd: () => void;
    openFromLibrary: () => void;
  } | null;
  subjectActions: { openAdd: () => void } | null;
  curriculumActions: { openAdd: () => void } | null;
  reportActions: { openCreate: () => void } | null;
  portfolioActions: { openCreate: () => void } | null;
  setMilestoneActions: (actions: LearningActionsContextValue["milestoneActions"]) => void;
  setSubjectActions: (actions: LearningActionsContextValue["subjectActions"]) => void;
  setCurriculumActions: (actions: LearningActionsContextValue["curriculumActions"]) => void;
  setReportActions: (actions: LearningActionsContextValue["reportActions"]) => void;
  setPortfolioActions: (actions: LearningActionsContextValue["portfolioActions"]) => void;
}

export const DEFAULT_LEARNING_FILTER: LearningFilterState = {
  classroom: "All Classroom",
  classroomId: "",
  status: "all",
  period: "This year",
  startDate: "",
  endDate: "",
};

const defaultFilterState = DEFAULT_LEARNING_FILTER;

const defaultValue: LearningActionsContextValue = {
  filterState: defaultFilterState,
  setFilterState: () => {},
  milestoneActions: null,
  subjectActions: null,
  curriculumActions: null,
  reportActions: null,
  portfolioActions: null,
  setMilestoneActions: () => {},
  setSubjectActions: () => {},
  setCurriculumActions: () => {},
  setReportActions: () => {},
  setPortfolioActions: () => {},
};

const LearningActionsContext = createContext<LearningActionsContextValue>(defaultValue);

export function LearningActionsProvider({ children }: { children: React.ReactNode }) {
  const [filterState, setFilterState] = useState<LearningFilterState>(defaultFilterState);
  const [milestoneActions, setMilestoneActionsState] =
    useState<LearningActionsContextValue["milestoneActions"]>(null);
  const [subjectActions, setSubjectActionsState] =
    useState<LearningActionsContextValue["subjectActions"]>(null);
  const [curriculumActions, setCurriculumActionsState] =
    useState<LearningActionsContextValue["curriculumActions"]>(null);
  const [reportActions, setReportActionsState] =
    useState<LearningActionsContextValue["reportActions"]>(null);
  const [portfolioActions, setPortfolioActionsState] =
    useState<LearningActionsContextValue["portfolioActions"]>(null);

  const setMilestoneActions = useCallback(
    (actions: LearningActionsContextValue["milestoneActions"]) => {
      setMilestoneActionsState(() => actions);
    },
    [],
  );
  const setSubjectActions = useCallback(
    (actions: LearningActionsContextValue["subjectActions"]) => {
      setSubjectActionsState(() => actions);
    },
    [],
  );
  const setCurriculumActions = useCallback(
    (actions: LearningActionsContextValue["curriculumActions"]) => {
      setCurriculumActionsState(() => actions);
    },
    [],
  );
  const setReportActions = useCallback(
    (actions: LearningActionsContextValue["reportActions"]) => {
      setReportActionsState(() => actions);
    },
    [],
  );
  const setPortfolioActions = useCallback(
    (actions: LearningActionsContextValue["portfolioActions"]) => {
      setPortfolioActionsState(() => actions);
    },
    [],
  );

  const value: LearningActionsContextValue = {
    filterState,
    setFilterState,
    milestoneActions,
    subjectActions,
    curriculumActions,
    reportActions,
    portfolioActions,
    setMilestoneActions,
    setSubjectActions,
    setCurriculumActions,
    setReportActions,
    setPortfolioActions,
  };

  return (
    <LearningActionsContext.Provider value={value}>{children}</LearningActionsContext.Provider>
  );
}

export function useLearningActions() {
  const context = useContext(LearningActionsContext);
  if (!context) {
    throw new Error("useLearningActions must be used within LearningActionsProvider");
  }
  return context;
}
