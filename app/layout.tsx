import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReviewFly",
  description:
    "Multi-tenant SaaS for AI-generated Google reviews with sentiment gate",
  robots: { index: false, follow: false }, // open up in marketing phase
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
