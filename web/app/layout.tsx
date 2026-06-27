import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Porta Nusa Hotel RFID Linen Visibility Platform",
  description: "Website-only functional MVP for hotel linen RFID operations"
};

import { DemoModeProvider } from "@/components/demo-mode-provider";
import { AppShell } from "@/components/app-shell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DemoModeProvider>
          <AppShell>
            {children}
          </AppShell>
        </DemoModeProvider>
      </body>
    </html>
  );
}
