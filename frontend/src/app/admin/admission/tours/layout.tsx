import { TourProvider } from "@/contexts/TourContext";
import { ReactNode } from "react";

export default function ToursLayout({ children }: { children: ReactNode }) {
  return <TourProvider>{children}</TourProvider>;
}
