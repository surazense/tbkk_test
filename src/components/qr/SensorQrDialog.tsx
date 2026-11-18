"use client";

import { QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SensorLoginQr from "@/components/qr/SensorLoginQr";

interface SensorQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Opened from the user menu in the header. The content is removed when the
// dialog closes, so the password and the QR code never stay on the page.
export default function SensorQrDialog({
  open,
  onOpenChange,
}: SensorQrDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-[#374151] bg-[#0B1121] text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <QrCode className="h-5 w-5 text-blue-400" aria-hidden="true" />
            Sensor login QR
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Make a QR code that signs a sensor in with an account.
          </DialogDescription>
        </DialogHeader>

        <SensorLoginQr />
      </DialogContent>
    </Dialog>
  );
}
