"use client";

import { useDebouncer } from "@/utils/hooks/useDebouncer";
import { ChangeEvent, useState } from "react";

const useResultsPage = (role: "admin" | "staff" = "admin") => {
  const [selectedFilter, setSelectedFilter] = useState<string>("Filter");
  const { debouncedSearch, setSearch } = useDebouncer();
  const handleSearch = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearch(e.target.value);
  };

  const teachers = [
    {
      name: "Kwame Nkrumah",
      subject: "English Literature",
      classes: "Grade 3",
      phone: "+234 805 123 4567",
      address: "123 Elm St, Springfield, IL",
    },
    {
      name: "Amina Diallo",
      subject: "History",
      classes: "Grade 5",
      phone: "+234 701 234 5678",
      address: "123 Elm St, Springfield, IL",
    },
    {
      name: "Thandiwe Moyo",
      subject: "Math",
      classes: "Grade 2",
      phone: "+234 903 345 6789",
      address: "123 Elm St, Springfield, IL",
    },
    {
      name: "Chinedu Okafor",
      subject: "Science",
      classes: "Grade 4",
      phone: "+234 901 456 7890",
      address: "123 Elm St, Springfield, IL",
    },
    {
      name: "Fatoumata Sow",
      subject: "Science",
      classes: "Grade 1",
      phone: "+234 802 567 8901",
      address: "123 Elm St, Springfield, IL",
    },
    {
      name: "Juma Mwanga",
      subject: "Science",
      classes: "Grade 2",
      phone: "+234 704 678 9012",
      address: "123 Elm St, Springfield, IL",
    },
    {
      name: "Zuri Karanja",
      subject: "Science",
      classes: "Grade 5",
      phone: "+234 906 789 0123",
      address: "123 Elm St, Springfield, IL",
    },
    {
      name: "Juma Mwanga",
      subject: "Science",
      classes: "Grade 2",
      phone: "+234 704 678 9012",
      address: "123 Elm St, Springfield, IL",
    },
    {
      name: "Chinedu Okafor",
      subject: "Science",
      classes: "Grade 3",
      phone: "(555) 101-0104",
      address: "123 Elm St, Springfield, IL",
    },
    {
      name: "Zuri Karanja",
      subject: "Science",
      classes: "Grade 5",
      phone: "+234 906 789 0123",
      address: "123 Elm St, Springfield, IL",
    },

    {
      name: "Chinedu Okafor",
      subject: "Science",
      classes: "Grade 3",
      phone: "(555) 101-0104",
      address: "123 Elm St, Springfield, IL",
    },
  ];

  const curriculum = [
    {
      childName: "Kwame Nkrumah",
      classes: "Grade 1",
      score: 57,
      grade: "F",
      assessmentTaken: 4,
      status: "Failed",
    },
    {
      childName: "Amina Diallo",
      classes: "Grade 1",
      score: 72.4,
      grade: "C",
      assessmentTaken: 3,
      status: "Pass",
    },
    {
      childName: "Thandiwe Moyo",
      classes: "Grade 1",
      score: 78.7,
      grade: "C",
      assessmentTaken: 7,
      status: "Pass",
    },
    {
      childName: "Chinedu Okafor",
      classes: "Grade 1",
      score: 59.9,
      grade: "F",
      assessmentTaken: 6,
      status: "Failed",
    },
    {
      childName: "Fatoumata Sow",
      classes: "Grade 1",
      score: 63.6,
      grade: "A",
      assessmentTaken: 2,
      status: "Pass",
    },
    {
      childName: "Juma Mwanga",
      classes: "Grade 1",
      score: 61.7,
      grade: "B",
      assessmentTaken: 7,
      status: "Pass",
    },
    {
      childName: "Zuri Karanja",
      classes: "Grade 1",
      score: 64.5,
      grade: "F",
      assessmentTaken: 4,
      status: "Failed",
    },
    {
      childName: "Juma Mwanga",
      classes: "Grade 1",
      score: 40.2,
      grade: "A",
      assessmentTaken: 5,
      status: "Pass",
    },
    {
      childName: "Chinedu Okafor",
      classes: "Grade 1",
      score: 57,
      grade: "A",
      assessmentTaken: 5,
      status: "Failed",
    },
    {
      childName: "Zuri Karanja",
      classes: "Grade 1",
      score: 80,
      grade: "A",
      assessmentTaken: 5,
      status: "Failed",
    },
    {
      childName: "Chinedu Okafor",
      classes: "Grade 1",
      score: 57,
      grade: "A",
      assessmentTaken: 5,
      status: "Pass",
    },
  ];

  return {
    selectedFilter,
    setSelectedFilter,
    teachers,
    curriculum,
    role,
    handleSearch,
  };
};

export default useResultsPage;
