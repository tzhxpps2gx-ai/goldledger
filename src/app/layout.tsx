import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoldLedger — Trading Journal",
  description: "Persönliches Trading-Journal für XAUUSD-Daytrading.",
  applicationName: "GoldLedger",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GoldLedger",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="dark">
      <body className="bg-bg text-white antialiased">{children}</body>
    </html>
  );
}
