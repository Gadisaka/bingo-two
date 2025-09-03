import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthContext";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import {
  Acme,
  Josefin_Sans,
  Pacifico,
  Style_Script,
  Ubuntu,
  Potta_One,
} from "next/font/google";
import localFont from "next/font/local";

const acme = Acme({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-acme",
});
const josefin = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
});
const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pacifico",
});
const styleScript = Style_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-style-script",
});
const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-ubuntu",
});
const pottaOne = Potta_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-potta-one",
});

const varsity = localFont({
  src: "../public/font/Varsity.otf",
  variable: "--font-varsity",
});

export const metadata: Metadata = {
  title: "Gold Bingo",
  description: "Bingo Game Shop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${acme.variable} ${josefin.variable} ${pacifico.variable} ${styleScript.variable} ${ubuntu.variable} ${pottaOne.variable} ${varsity.variable}`}
    >
      <body className={`antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
            <ServiceWorkerRegister />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
