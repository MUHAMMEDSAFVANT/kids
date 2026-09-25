import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Starly | Kids Star Voting",
  description: "Responsive kids star voting page inspired by the provided design.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#070b09] text-[#f2efe6]">{children}</body>
    </html>
  );
}
