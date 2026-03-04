"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import FolderTree from "@/components/layout/FolderTree";
import type { Sensor } from "@/lib/types";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterChange: (ids: string[], sensors: Sensor[]) => void;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  onFilterChange,
}: MobileDrawerProps) {
  const pathname = usePathname();

  // Auto-close drawer on navigation
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-[#0B1121] border-r-[1.35px] border-[#374151] flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#374151] shrink-0">
          <h2 className="text-white font-semibold text-base">
            Organization Tree
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* FolderTree Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden [&>*]:!w-full [&>*]:!border-r-0">
          <FolderTree onFilterChange={onFilterChange} />
        </div>
      </div>
    </>
  );
}
