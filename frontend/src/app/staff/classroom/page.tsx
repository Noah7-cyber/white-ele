import { Metadata } from "next";
import { ClassRoomPage } from "@/modules/staff/page/ClassRoom";

export const metadata: Metadata = {
  title: "Classrooms",
};

const Classroom = () => <ClassRoomPage />;

export default Classroom;