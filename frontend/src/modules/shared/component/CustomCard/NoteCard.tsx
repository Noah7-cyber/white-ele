import { FileText } from "lucide-react";
import IconCard from "./IconCard";

export function NoteCard() {
  return <IconCard icon={<FileText className="w-full h-full" />} label="Notes" />;
}
