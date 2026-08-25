import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/playfair-display/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Timer Studio",
  description:
    "Create beautiful countdown timer videos for your study content.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
