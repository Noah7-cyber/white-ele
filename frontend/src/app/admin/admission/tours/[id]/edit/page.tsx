"use client";

import { useParams } from "next/navigation";
import CreateTourPage from "@/modules/admin/page/CreateTourPage/CreateTourPage";

const EditTourPage = () => {
  const params = useParams();
  const tourId = params?.id as string | undefined;

  if (!tourId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <p className="text-primary-text-light">No tour selected.</p>
      </div>
    );
  }

  return <CreateTourPage mode="edit" tourId={tourId} />;
};

export default EditTourPage;
