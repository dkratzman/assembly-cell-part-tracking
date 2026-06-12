"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, History, Monitor, PlusCircle } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/", label: "Dashboard", icon: ClipboardList },
  { href: "/submit", label: "Submit", icon: PlusCircle },
  { href: "/monitor", label: "Monitor", icon: Monitor },
  { href: "/history", label: "History", icon: History },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link href={item.href} key={item.href} className={clsx("nav-link", active && "active")} aria-current={active ? "page" : undefined}>
            <Icon aria-hidden="true" size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
