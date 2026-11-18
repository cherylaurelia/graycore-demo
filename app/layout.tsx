import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Magento 2.4.7 back in check-extension: a fix for github-actions-magento2 #346 (unofficial demo)",
  description:
    "Composer 2.9 blocks every league/flysystem 2.x release, so Magento 2.4.7-p10 can't be installed and every 2.4.7 job fails. A one-step fix in fix-magento-install, verified on the fork's CI. Unofficial demo by Cheryl Aurelia.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
