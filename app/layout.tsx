import type { Metadata } from "next";

// Removed font imports and globals.css to disable Tailwind completely

export const metadata: Metadata = {
  title: "Sentinel — Minimal Guardian",
  description: "Minimal, bright emergency assistant",
  icons: {
    icon: "/favicon.svg",
  },
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
