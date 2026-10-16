import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ADAPTIVE STEALTH — The hunter learns",
  description: "A playable stealth horror prototype driven by imperfect perception, Utility AI, scent memory, and adaptive enemy tactics.",
  applicationName: "Adaptive Stealth",
  themeColor: "#070a0e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
