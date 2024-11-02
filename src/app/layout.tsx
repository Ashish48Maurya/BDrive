import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BDrive",
  description:
    "Securely Store Your Files",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ThirdwebProvider>{children}</ThirdwebProvider>
        </ThemeProvider>
      </body>
      <Toaster
        position="bottom-right"
      />
    </html>
  );
}
