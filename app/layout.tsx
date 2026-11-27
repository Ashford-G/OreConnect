
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OreConnect | Mining Business Ecosystem",
  description:
    "Connect mines, suppliers, logistics companies and mining service providers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
