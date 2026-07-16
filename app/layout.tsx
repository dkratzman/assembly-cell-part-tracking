import type { Metadata } from "next";
import { MainNav } from "@/components/main-nav";
import { PreviewModeBanner } from "@/components/preview-mode-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assembly Cell Part Tracking",
  description: "Track missing stall-build parts across the assembly cell.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div>
              <p className="eyebrow">Assembly Cell</p>
              <h1>Missing Parts</h1>
            </div>
            <MainNav />
          </aside>
          <main>
            <PreviewModeBanner />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
