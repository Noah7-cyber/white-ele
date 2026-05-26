import { ReactNode } from "react";

type IconCardProps = {
  icon: ReactNode;
  label: string;
};

export default function IconCard({ icon, label }: IconCardProps) {
  return (
    <div className="flex flex-col items-center justify-center w-28 h-28 rounded-2xl bg-gray-800 text-white shadow-md hover:bg-gray-700 transition cursor-pointer">
      <div className="w-10 h-10">{icon}</div>
      <span className="mt-2 text-sm">{label}</span>
    </div>
  );
}
