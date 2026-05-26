import { User } from "lucide-react";
import IconCard from "./IconCard";

export function NameToFaceCard() {
  return <IconCard icon={<User className="w-full h-full" />} label="Name to Face" />;
}
