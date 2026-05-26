"use client";

// import { Classroom } from "@/components/Table";
interface ClassroomRowProps {
  // classroom: Classroom;
  onActionClick?: () => void;
}

export default function ClassroomRow({ onActionClick: _onActionClick }: ClassroomRowProps) {
  return (
    // <tr className="border-t hover:bg-gray-50">
    //   <td className="px-6 py-3 text-green-900">{classroom.name}</td>
    //   <td className="px-6 py-3 text-green-900">{classroom.ageRange}</td>
    //   <td className="px-6 py-3 text-green-900">{classroom.capacity}</td>
    //   <td className="px-6 py-3 flex items-center gap-2 text-green-900">
    //     {classroom.enrolled}
    //     <div className="w-24 h-2 bg-gray-200 rounded">
    //       <div
    //         className="h-2 bg-yellow-400 rounded"
    //         style={{ width: `${(classroom.enrolled / classroom.capacity) * 100}%` }}
    //       />
    //     </div>
    //   </td>
    //   <td className="px-6 py-3 text-green-600">
    //     <button
    //       className="text-gray-500 hover:text-gray-700"
    //       onClick={onActionClick}
    //     >
    //       ⋮
    //     </button>
    //   </td>
    // </tr>
    <></>
  );
}
