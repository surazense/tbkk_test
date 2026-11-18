import SensorLoginQr from "@/components/qr/SensorLoginQr";

export default function SensorQrPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-3xl font-bold text-white">
        Sensor login QR
      </h1>

      <SensorLoginQr />
    </div>
  );
}
