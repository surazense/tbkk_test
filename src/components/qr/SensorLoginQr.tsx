"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
  Loader2,
  QrCode,
  Trash2,
} from "lucide-react";
import { login } from "@/api/login/login";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Size of the exported PNG in pixels. It is shown smaller on screen, so the
// downloaded picture stays sharp when it is printed or scanned from a screen.
const QR_PIXELS = 512;

// The login page the sensor serves itself, reached when a phone is joined to
// the sensor's own Wi-Fi.
const SENSOR_LOGIN_URL = "http://192.168.4.1/login";

// What the QR carries: the address of that page with the account's e-mail ("u")
// and password ("p") after the "#", percent-encoded, for example
// http://192.168.4.1/login#u=name%40example.com&p=secret
// The sensor's page reads them, asks the backend to check them
// (POST /sensor/auth/login) and opens its settings when the backend says yes.
function qrPayload(email: string, password: string): string {
  return `${SENSOR_LOGIN_URL}#u=${encodeURIComponent(email)}&p=${encodeURIComponent(password)}`;
}

function errorMessage(error: unknown): string {
  const err = error as {
    response?: { data?: { message?: string; error?: string } };
  };
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    "Could not check these credentials. Check the e-mail and password and try again."
  );
}

function fileSlug(email: string): string {
  const slug = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "account";
}

export default function SensorLoginQr() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [qr, setQr] = useState<{ email: string; value: string } | null>(null);

  const canSubmit = email.trim() !== "" && password !== "" && !checking;

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setChecking(true);
    setError("");
    try {
      const account = email.trim();
      // The QR is only made for a password that really works for this account.
      await login({ email: account, password });
      setQr({ email: account, value: qrPayload(account, password) });
      setPassword("");
      setShowPassword(false);
    } catch (err) {
      setQr(null);
      setError(errorMessage(err));
    } finally {
      setChecking(false);
    }
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas || !qr) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `sensor-login-qr-${fileSlug(qr.email)}.png`;
    link.click();
  }

  function handleClear() {
    setQr(null);
    setPassword("");
    setShowPassword(false);
    setError("");
  }

  return (
    <div className="space-y-6">
      <div
        role="note"
        className="flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100"
      >
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-400"
          aria-hidden="true"
        />
        <div className="space-y-1 leading-6">
          <p className="font-semibold text-amber-200">
            The QR code contains the account password
          </p>
          <p>
            Anyone who gets the picture can sign in as this account. Use an
            account with only the rights the sensors need (not an
            administrator), and keep the picture private.
          </p>
          <p>
            The QR code does not expire. It stops working when the account
            password changes. If the picture is lost or deleted, generate a new
            one here. Generating a QR code does not change the password.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={handleGenerate}
          className="space-y-5 rounded-2xl border border-[#374151] bg-[#0B1121] p-6"
          autoComplete="off"
        >
          <p className="border-b border-[#374151] pb-3 text-base font-semibold text-white">
            Account for the sensor
          </p>

          <div className="space-y-2">
            <Label htmlFor="qr-email" className="text-gray-300">
              E-mail
            </Label>
            <Input
              id="qr-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="account@example.com"
              autoComplete="off"
              className="border-[#374151] bg-[#11171F] text-white focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qr-password" className="text-gray-300">
              Password
            </Label>
            <div className="relative">
              <Input
                id="qr-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                className="border-[#374151] bg-[#11171F] pr-10 text-white focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400 hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              The password is checked against the account before the QR code is
              made. It is not saved anywhere.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-blue-600 text-white hover:bg-blue-500"
          >
            {checking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <QrCode className="mr-2 h-4 w-4" />
                Generate QR code
              </>
            )}
          </Button>
        </form>

        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[#374151] bg-[#0B1121] p-6">
          {qr ? (
            <>
              <div className="rounded-xl bg-white p-2">
                <QRCodeCanvas
                  ref={canvasRef}
                  value={qr.value}
                  size={QR_PIXELS}
                  level="M"
                  marginSize={4}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  style={{ width: 256, height: 256 }}
                />
              </div>
              <p className="max-w-full truncate text-sm text-gray-300">
                {qr.email}
              </p>
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-500"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PNG
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="flex-1 border-[#374151] bg-transparent text-gray-200 hover:bg-gray-700 hover:text-white"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-gray-500">
              <QrCode className="h-12 w-12" aria-hidden="true" />
              <p className="text-sm">
                Your QR code will appear here after the password is checked.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
