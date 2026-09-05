import type { Metadata } from "next";
import { Montserrat, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import CustomLayout from "@/customLayout";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "eShop AI",
  description: "eShop AI is a platform for shopping online",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", montserrat.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">
        <CustomLayout >
        {children}
        </CustomLayout>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
