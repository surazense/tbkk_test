"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";

export default function BottomNav() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: () => (
        <Image
          src="/Group 53.png"
          alt="Dashboard"
          width={22}
          height={22}
          style={{ filter: "invert(1) brightness(2)" }}
        />
      ),
    },
    {
      name: "Admin",
      href: "/admin",
      icon: () => (
        <Image
          src="/Group 51.png"
          alt="Admin"
          width={22}
          height={22}
          style={{ filter: "invert(1) brightness(2)" }}
        />
      ),
    },
    {
      name: "Settings",
      href: "/settings",
      icon: () => (
        <Image
          src="/Group 52.png"
          alt="Settings"
          width={22}
          height={22}
          style={{ filter: "invert(1) brightness(2)" }}
        />
      ),
    },
    {
      name: "History",
      href: "/history",
      icon: () => (
        <Image
          src="/Vector.png"
          alt="Notification"
          width={22}
          height={22}
          style={{ filter: "invert(1) brightness(2)", height: "auto" }}
        />
      ),
    },
  ];

  const filteredItems = navItems.filter((item) => {
    if (item.name === "Admin") {
      return user?.role?.toLowerCase() === "admin";
    }
    return true;
  });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B1121] border-t-[1.35px] border-[#374151] flex items-stretch h-16 safe-area-bottom">
      {filteredItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href === "/" && pathname.startsWith("/sensors/")) ||
          (pathname.startsWith(item.href) && item.href !== "/");

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive
                ? "text-blue-400 bg-blue-900/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {typeof item.icon === "function"
                ? item.icon()
                : React.createElement(item.icon, { size: 22 })}
            </div>
            <span className="text-[10px] font-medium leading-none">
              {item.name}
            </span>
          </Link>
        );
      })}

      {/* Logout */}
      <button
        onClick={logout}
        className="flex-1 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <LogOut size={22} />
        <span className="text-[10px] font-medium leading-none">Logout</span>
      </button>
    </nav>
  );
}
