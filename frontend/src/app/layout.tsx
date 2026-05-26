import "./globals.css";
import { ReactNode, Suspense } from "react";
import { ModalProvider } from "@/modules/shared/component/ModalProvider/modalProvider";
import { Inter } from "next/font/google";
import { Providers } from "./Providers";
import type { Metadata, Viewport } from "next";
export const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WhitePenguin",
    template: "%s - WhitePenguin",
  },
  description: "WhitePenguin",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={` ${inter.className} bg-gray-50 text-gray-900 `}>
        <Providers>
          <Suspense fallback={<div></div>}>
            <ModalProvider />
            {children}
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
