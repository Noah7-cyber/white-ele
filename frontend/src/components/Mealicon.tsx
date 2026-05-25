import { Utensils } from "lucide-react";

export default function MealCard() {
  return (
    <button
      className="flex flex-col items-center justify-center gap-2 p-6 bg-white rounded-xl shadow hover:shadow-lg transition w-28 h-28"
    >
      <Utensils className="text-teal-600 w-8 h-8" />

      <span className="text-sm font-medium text-gray-700">MEAL</span>
    </button>
  );
}
