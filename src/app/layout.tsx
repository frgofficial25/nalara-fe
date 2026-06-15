import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nalara — National AI & Deep Learning Acceleration Bootcamp",
  description:
    "Program bootcamp intensif AI, Deep Learning, dan MLOps di bawah naungan FILKOM Research Group (FRG) Universitas Brawijaya. 32 jam per level, 12 hari instruksional.",
  keywords: [
    "AI bootcamp",
    "deep learning",
    "MLOps",
    "Universitas Brawijaya",
    "FILKOM",
    "computer vision",
    "machine learning",
    "nalara",
  ],
  authors: [{ name: "FRG FILKOM Universitas Brawijaya" }],
};

export const viewport: Viewport = {
  themeColor: "#212121",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
