import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Starly | Kids Star Voting",
    template: "%s | Starly",
  },
  description: "Responsive kids star voting page inspired by the provided design.",
  openGraph: {
    title: "Starly | Kids Star Voting",
    description: "Responsive kids star voting page inspired by the provided design.",
    type: "website",
    siteName: "Starly",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    images: [
      {
        url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "Starly kids star voting preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Starly | Kids Star Voting",
    description: "Responsive kids star voting page inspired by the provided design.",
    images: [
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80",
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#070b09] text-[#f2efe6]">{children}</body>
    </html>
  );
}
