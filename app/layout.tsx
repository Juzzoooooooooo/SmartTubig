import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmarTubig · Water Monitoring & Control",
  description: "Real-time water tank monitoring and assisted distribution control for Barangay Hinanggayon.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
