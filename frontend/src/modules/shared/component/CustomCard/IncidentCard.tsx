import { AlertTriangle } from "lucide-react";
import IconCard from "./IconCard";

export function IncidentCard() {
  return <IconCard icon={<AlertTriangle className="w-full h-full" />} label="Incident" />;
}
