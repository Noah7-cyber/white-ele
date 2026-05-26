import { Metadata } from "next";
import TourPreviewClient from "./TourPreviewClient";

export const metadata: Metadata = {
  title: "Tour Events",
};

export default function PublicTourPage() {
  return <TourPreviewClient />;
}
