import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";

import { THEME_COOKIE, parseTheme } from "@/lib/theme";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "vietnamese"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "YourLife", template: "%s · YourLife" },
  description: "One life. One system. One truth.",
  applicationName: "YourLife",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "YourLife", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    // "system" follows the device: a tiny script adds the class before the first paint (no flash).
    <html lang={locale} className={theme === "dark" ? "dark" : undefined} suppressHydrationWarning>
      {theme === "system" && (
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html:
                "try{var m=matchMedia('(prefers-color-scheme: dark)'),c=document.documentElement.classList;c.toggle('dark',m.matches);m.addEventListener('change',function(e){c.toggle('dark',e.matches)})}catch(e){}",
            }}
          />
        </head>
      )}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
