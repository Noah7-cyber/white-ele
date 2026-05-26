"use client";

import { Dispatch, SetStateAction } from "react";
import BasicInfo from "./components/BasicInfo";
import Availability from "./components/Availability";
import Notifications from "./components/Notifications";
import Questions from "./components/Questions";
import { navItems, AllTourFormData } from "./tour.constants";
import { Control, UseFormGetValues, UseFormSetValue, UseFormTrigger, FormState, UseFormWatch } from "react-hook-form";
import { useMediaQuery } from "@/utils/hooks/useMediaQuery";

interface MainContentProps {
  control: Control<AllTourFormData>;
  setValue: UseFormSetValue<AllTourFormData>;
  getValues: UseFormGetValues<AllTourFormData>;
  watch: UseFormWatch<AllTourFormData>;
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  trigger: UseFormTrigger<AllTourFormData>;
  formState: FormState<AllTourFormData>;
}

const MainContent = ({
  control,
  setValue,
  getValues,
  watch,
  activeTab,
  setActiveTab,
  trigger,
  formState,
}: MainContentProps) => {
  const isMobile = useMediaQuery("(max-width:768px)");
  const requiredTabOrder = ["basic", "availability", "notification"] as const;

  // Map each tab to its validation fields
  const tabValidationFields: Record<string, (keyof AllTourFormData)[]> = {
    basic: ["basicInfo"],
    availability: ["availability"],
    notification: ["notification"],
    question: [], // No validation needed for questions (optional step)
  };

  // Validate current tab before navigation
  const validateAndNavigate = async (targetTab: string) => {
    // If navigating to the same tab, allow it
    if (targetTab === activeTab) {
      setActiveTab(targetTab);
      return;
    }

    // If navigating backwards, allow it without validation
    const currentTabIndex = navItems.findIndex((item) => item.id === activeTab);
    const targetTabIndex = navItems.findIndex((item) => item.id === targetTab);
    if (targetTabIndex < currentTabIndex) {
      setActiveTab(targetTab);
      return;
    }

    // Validate all required tabs up to the target tab before allowing forward navigation.
    const requiredTabsToValidate = requiredTabOrder.filter((requiredTab) => {
      const requiredTabIndex = navItems.findIndex((item) => item.id === requiredTab);
      return requiredTabIndex < targetTabIndex;
    });

    for (const tabId of requiredTabsToValidate) {
      const fieldsToValidate = tabValidationFields[tabId];
      if (!fieldsToValidate?.length) continue;

      const isValid = await trigger(fieldsToValidate);
      if (!isValid) {
        setActiveTab(tabId);
        return;
      }
    }

    // Validation passed or no validation needed, allow navigation
    setActiveTab(targetTab);
  };

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* SideBar */}
      <aside className="hidden md:block w-54 py-6">
        <div className=" border-r border-[#008080]/20 h-full">
          <div className="p-4 rounded-xl h-full">
            <div className="space-y-1">
              {navItems.map((item, idx) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => validateAndNavigate(item.id)}
                    className={`flex text-sm cursor-pointer px-2 py-1 items-center gap-4 w-full text-left transition-all duration-150 ${
                      isActive ? " " : "hover:bg-white/50"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-7 h-7 text-xs font-bold rounded-full ${
                        isActive ? "bg-[#007C79] text-white" : "bg-white shadow-xs text-[#001F1FB2]"
                      }`}
                    >
                      {idx + 1}
                    </span>

                    <span
                      className={`${isActive ? "text-[#083737] font-semibold" : "text-gray-600"}`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {isMobile && (
        <div className="border-b border-[#E4E7EC] overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => validateAndNavigate(item.id)}
                  className={`shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? "border-brandColor-active text-brandColor-active"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Renders Active Component */}
      <div className={`flex-1 min-h-0 overflow-y-auto ${isMobile ? "pb-6" : ""}`}>
        <div className={`${activeTab !== "basic" ? "hidden" : ""}`}>
          <BasicInfo control={control} setValue={setValue} getValues={getValues} />
        </div>

        <div className={`${activeTab !== "availability" ? "hidden" : ""}`}>
          <Availability control={control} setValue={setValue} formState={formState} />
        </div>

        <div className={`${activeTab !== "notification" ? "hidden" : ""}`}>
          <Notifications control={control} setValue={setValue} getValues={getValues} />
        </div>

        <div className={`${activeTab !== "question" ? "hidden" : ""}`}>
          <Questions control={control} setValue={setValue} getValues={getValues} watch={watch} />
        </div>
      </div>
    </div>
  );
};

export default MainContent;
