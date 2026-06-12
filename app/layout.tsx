import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, History, Monitor, PlusCircle } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assembly Cell Part Tracking",
  description: "Track missing stall-build parts across the assembly cell.",
};

const navItems = [
  { href: "/", label: "Dashboard", icon: ClipboardList },
  { href: "/submit", label: "Submit", icon: PlusCircle },
  { href: "/monitor", label: "Monitor", icon: Monitor },
  { href: "/history", label: "History", icon: History },
];

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
            <nav aria-label="Main navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link href={item.href} key={item.href} className="nav-link">
                    <Icon aria-hidden="true" size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
