import { Metadata } from "next";
import { ImageLibraryPage } from "@/modules/parent/page/ImageLibrary/imageLibrary";

export const metadata: Metadata = {
  title: "Image Library",
};

export default function Page() {
  return <ImageLibraryPage />;
}
