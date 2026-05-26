import { Pill } from "lucide-react";
import IconCard from "./IconCard";

export function MedicationCard() {
  return <IconCard icon={<Pill className="w-full h-full" />} label="Medication" />;
}
