import { Suspense } from "react";
import Link from "next/link";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import UserSettings from "@/components/settings/UserSettings";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-3xl font-bold text-white">Settings</h1>
        <div className="flex gap-2">
          <Link
            href="/machines"
            className="rounded border border-[#1e293b] hover:bg-[#162033] px-3 py-2 text-sm text-white"
          >
            Machine Health
          </Link>
          <Link
            href="/settings/thresholds"
            className="rounded bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm text-white"
          >
            Vibration Thresholds
          </Link>
        </div>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <UserSettings />
      </Suspense>
    </div>
  );
}
