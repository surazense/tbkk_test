"use client";

import { QRCodeCanvas } from "qrcode.react";
import { Wifi } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  normalizeSensorMac,
  sensorWifiPassword,
  sensorWifiSsid,
  wifiQrPayload,
} from "@/lib/sensorWifi";

// Size of the drawn QR in pixels. It is shown smaller, so it stays sharp.
const QR_PIXELS = 512;

interface SensorWifiQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The MAC address of the sensor, as the page shows it.
  mac?: string | null;
}

function WifiQrBody({ mac }: { mac?: string | null }) {
  const normalizedMac = normalizeSensorMac(mac);

  if (!normalizedMac) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
      >
        The MAC address of this sensor is not available, so its Wi-Fi name and
        password cannot be made.
      </p>
    );
  }

  const ssid = sensorWifiSsid(normalizedMac);
  const password = sensorWifiPassword(normalizedMac);

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#374151] bg-[#0B1121] p-5">
        <div className="rounded-xl bg-white p-2">
          <QRCodeCanvas
            value={wifiQrPayload(ssid, password)}
            size={QR_PIXELS}
            level="M"
            marginSize={4}
            bgColor="#ffffff"
            fgColor="#000000"
            style={{ width: 224, height: 224 }}
          />
        </div>
        <dl className="grid w-full grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-gray-400">Wi-Fi</dt>
          <dd className="truncate font-mono text-white">{ssid}</dd>
          <dt className="text-gray-400">Password</dt>
          <dd className="font-mono tracking-wider text-white">{password}</dd>
        </dl>
      </div>

      <p className="text-xs leading-5 text-gray-500">
        After the phone has joined this Wi-Fi, scan the login QR code (user menu
        &gt; Sensor QR) to open the settings page of the sensor.
      </p>
    </div>
  );
}

// Opened from the Wi-Fi button on the sensor page. The QR code is made as soon
// as it opens, from the MAC address of the sensor: nothing has to be typed.
export default function SensorWifiQrDialog({
  open,
  onOpenChange,
  mac,
}: SensorWifiQrDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-[#374151] bg-[#0B1121] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Wifi className="h-5 w-5 text-blue-400" aria-hidden="true" />
            Sensor Wi-Fi QR
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Scan with a phone to join the Wi-Fi of this sensor.
          </DialogDescription>
        </DialogHeader>

        <WifiQrBody mac={mac} />
      </DialogContent>
    </Dialog>
  );
}
