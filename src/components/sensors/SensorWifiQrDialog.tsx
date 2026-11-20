"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode, Wifi } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  normalizeSensorMac,
  sensorWifiPassword,
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
  const [ssid, setSsid] = useState("");
  const normalizedMac = normalizeSensorMac(mac);

  if (!normalizedMac) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
      >
        The MAC address of this sensor is not available, so its Wi-Fi password
        cannot be made.
      </p>
    );
  }

  const password = sensorWifiPassword(normalizedMac);
  const name = ssid.trim();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="wifi-ssid" className="text-gray-300">
          Wi-Fi name (SSID)
        </Label>
        <Input
          id="wifi-ssid"
          value={ssid}
          onChange={(event) => setSsid(event.target.value)}
          placeholder="The name shown in the phone's Wi-Fi list"
          autoComplete="off"
          spellCheck={false}
          className="border-[#374151] bg-[#11171F] text-white focus:border-blue-500"
        />
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#374151] bg-[#0B1121] p-5">
        {name ? (
          <>
            <div className="rounded-xl bg-white p-2">
              <QRCodeCanvas
                value={wifiQrPayload(name, password)}
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
              <dd className="truncate text-white">{name}</dd>
              <dt className="text-gray-400">Password</dt>
              <dd className="font-mono tracking-wider text-white">
                {password}
              </dd>
            </dl>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-center text-gray-500">
            <QrCode className="h-12 w-12" aria-hidden="true" />
            <p className="text-sm">Type the Wi-Fi name to make the QR code.</p>
          </div>
        )}
      </div>

      <p className="text-xs leading-5 text-gray-500">
        After the phone has joined this Wi-Fi, scan the login QR code (user menu
        &gt; Sensor QR) to open the settings page of the sensor.
      </p>
    </div>
  );
}

// Opened from the Wi-Fi button on the sensor page. The content is removed when
// the dialog closes, so the typed name does not stay on the page.
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
