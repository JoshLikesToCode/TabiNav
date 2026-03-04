import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TabiNav — Japan Trip Planner",
  description:
    "Plan your perfect Tokyo itinerary in minutes. Share with anyone via a single link — no account needed.",
  icons: {
    icon: "/images/tabinav-logo.png",
    apple: "/images/tabinav-logo.png",
  },
  openGraph: {
    title: "TabiNav — Japan Trip Planner",
    description:
      "Instant, shareable Japan itineraries. No account needed.",
    type: "website",
    images: [{ url: "/images/tabinav-logo.png", width: 1536, height: 1024 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              fontFamily: "var(--font-inter)",
              borderRadius: "0.75rem",
            },
          }}
        />
      </body>
    </html>
  );
}
