import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fin Assist",
  description: "Personal finance tracker for managing spending and savings."
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
