import ThresholdManager from "@/components/settings/ThresholdManager";

export default function ThresholdsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-3xl font-bold text-white">
        Vibration Thresholds
      </h1>
      <ThresholdManager />
    </div>
  );
}
