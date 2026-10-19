import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrueSeat",
  description: "Check your university seat before you pay.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
