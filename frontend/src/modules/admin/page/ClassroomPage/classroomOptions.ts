export const ageOptions = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"];

export const staffDataFromApi = [
  { label: "Mr. Abdi Hassan", id: 1 },
  { label: "Ms. Nia Mwanga", id: 2 },
  { label: "Mr. Juma Chibale", id: 3 },
  { label: "Ms. Leila Khamis", id: 4 },
  { label: "Mr. Kofi Mensah", id: 5 },
  { label: "Ms. Amara Okafor", id: 6 },
];

interface StaffOption {
  label: string;
  value: number;
}

export const staffOptions: StaffOption[] = staffDataFromApi.map((staff) => ({
  label: staff.label,
  value: staff.id,
}));
