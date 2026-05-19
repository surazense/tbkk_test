import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { compressImage } from "./utils/imageUtils";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string, includeTime = false): string {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };

    if (includeTime) {
      return `${date.toLocaleDateString("en-US", options)}, ${date.toLocaleTimeString(
        "en-US",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
      )}`;
    }

    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error";
  }
}

export function formatThaiDate(dateString: string | undefined | null): string {
  if (
    !dateString ||
    typeof dateString !== "string" ||
    !dateString.includes("T")
  )
    return "N/A";
  try {
    const [datePart, timePartRaw] = dateString.split("T");
    if (!datePart || !timePartRaw) return "N/A";
    const date = datePart.split("-").reverse().join("/");
    const time = timePartRaw.split("Z")[0];
    return `${date} ${time}`;
  } catch {
    return "N/A";
  }
}

export function formatRawTime(dateString: string): string {
  if (!dateString) return "N/A";
  try {
    // Always parse as UTC, then add 7 hours for Thailand time
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    const thailandTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const day = thailandTime.getUTCDate().toString().padStart(2, "0");
    const month = (thailandTime.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = thailandTime.getUTCFullYear();
    const hours = thailandTime.getUTCHours().toString().padStart(2, "0");
    const minutes = thailandTime.getUTCMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error("Error formatting raw time:", error);
    return "Error";
  }
}

// Generate a random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Convert RSSI to signal strength level (0-4)
// This function handles both raw dBm values (negative) and pre-calculated levels (0-4)
export function getSignalStrength(rssiInput: number): number {
  const rssi = Number(rssiInput);

  // If rssi is negative, it's likely dBm (dBm values are typically -30 to -100)
  if (rssi < 0) {
    if (rssi >= -70) return 4; // Excellent
    if (rssi >= -80) return 3; // Good
    if (rssi >= -90) return 2; // Fair
    if (rssi >= -100) return 1; // Poor
    return 0; // No Signal
  }

  // If rssi is positive or 0, it's likely already a level (0-4)
  if (rssi === 0) return 0;
  if (rssi <= 1) return 1;
  if (rssi <= 2) return 2;
  if (rssi <= 3) return 3;
  return 4;
}

// Get signal strength label in English
export function getSignalStrengthLabel(rssi: number): string {
  const level = getSignalStrength(rssi);
  switch (level) {
    case 0:
      return "No Signal";
    case 1:
      return "Poor";
    case 2:
      return "Fair";
    case 3:
      return "Good";
    case 4:
      return "Excellent";
    default:
      return "N/A";
  }
}

// Upload sensor image to API
export async function uploadSensorImage(
  sensorId: string,
  imageFile: File
): Promise<{ image_url: string; message: string; status: string }> {
  // Compress image before upload
  const compressedFile = await compressImage(imageFile, 1200, 1200, 0.85);

  const base64Image = await toBase64(compressedFile);
  const contentType = imageFile.type || "image/jpeg";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const url = `${"/api"}/sensors/${sensorId}/image`;
  console.log("Uploading image to URL:", url);

  const payload = {
    image_base64: base64Image,
    content_type: contentType,
  };

  // Log payload (truncate base64 for readability)
  console.log("Sending Payload:", {
    ...payload,
    image_base64:
      payload.image_base64.substring(0, 50) +
      "..." +
      payload.image_base64.substring(payload.image_base64.length - 20),
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.headers.get("content-type")?.includes("application/json")) {
      const errorData = await response.json();
      throw new Error(
        `HTTP error! status: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }
    throw new Error(
      `HTTP error! status: ${response.status} ${response.statusText}`
    );
  }

  const responseData = await response.json();
  console.log("Upload Response Status:", response.status);
  console.log("Upload Response Body:", responseData);

  return responseData;
}

export async function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result.split(",")[1] || result);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Generates a distinct color based on an index using golden angle approximation.
 * Shared between charts and tables to ensure color consistency.
 */
export const getDistinctColor = (index: number) => {
  if (index < 0) return "transparent";
  
  // Curated premium, vibrant, harmonized colors (slightly darker/richer for dark mode contrast)
  const premiumColors = [
    "hsl(142, 72%, 40%)", // 0: Emerald Green
    "hsl(217, 91%, 48%)", // 1: Sleek Blue
    "hsl(262, 83%, 52%)", // 2: Modern Violet
    "hsl(32, 95%, 44%)",  // 3: Warm Amber
    "hsl(190, 90%, 40%)", // 4: Premium Cyan
    "hsl(340, 85%, 46%)", // 5: Rose Pink
  ];

  if (index < premiumColors.length) {
    return premiumColors[index];
  }

  // Golden angle fallback for higher indices
  const hue = ((index - premiumColors.length) * 137.508 + 60) % 360;
  const lightness = 45 + (index % 3) * 5;
  return `hsl(${hue}, 85%, ${lightness}%)`;
};

/**
 * Calculates a decayed battery level starting from 13/05/2026 (2569 BE).
 * Decreases by 0.03 units per day.
 * 
 * @param originalBattery The original battery value (0-100)
 * @param datetimeStr The datetime string of the reading
 * @param isSatellite Whether the device is a Satellite sensor
 */
export function getDecayedBattery(
  originalBattery: number,
  datetimeStr: string | undefined | null,
  isSatellite: boolean
): number {
  if (!isSatellite || !datetimeStr || originalBattery === undefined || originalBattery === null) {
    return originalBattery;
  }

  try {
    let itemDate: Date;
    const cleanStr = datetimeStr.trim();
    
    if (cleanStr.includes("/")) {
      // Handle "DD/MM/YYYY hh:mm:ss" or "DD/MM/YYYYThh:mm:ss"
      const separator = cleanStr.includes("T") ? "T" : " ";
      const parts = cleanStr.split(separator);
      const datePart = parts[0];
      const timePart = parts[1] || "00:00:00";
      const [day, month, year] = datePart.split("/").map(Number);
      const [hour, minute, second] = timePart.split("Z")[0].split(":").map(Number);
      itemDate = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
    } else if (cleanStr.includes("-") && !cleanStr.includes("T")) {
      // Handle "DD-MMM-YYYY,hh:mm:ss"
      if (cleanStr.includes(",")) {
        const [datePart, timePart] = cleanStr.split(",");
        const [day, monthStr, year] = datePart.split("-");
        const [hour, minute, second] = timePart.split("Z")[0].split(":").map(Number);
        const months: Record<string, number> = {
          Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
          Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
        };
        itemDate = new Date(Number(year), months[monthStr] || 0, Number(day), hour || 0, minute || 0, second || 0);
      } else {
        const parts = cleanStr.split(" ");
        const datePart = parts[0];
        const timePart = parts[1] || "00:00:00";
        const [day, month, year] = datePart.split("-").map(Number);
        const [hour, minute, second] = timePart.split("Z")[0].split(":").map(Number);
        itemDate = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
      }
    } else {
      const rawString = cleanStr.endsWith("Z") ? cleanStr.slice(0, -1) : cleanStr;
      itemDate = new Date(rawString);
    }

    if (isNaN(itemDate.getTime())) return originalBattery;

    // 13 May 2026 (BE 2569)
    const startDecayDate = new Date("2026-05-13T00:00:00");
    const diffMs = itemDate.getTime() - startDecayDate.getTime();

    if (diffMs > 0) {
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      const decayed = originalBattery - diffDays * 3.0;
      return Math.max(0, Math.min(100, Number(decayed.toFixed(4))));
    }
  } catch (error) {
    console.error("Error calculating decayed battery:", error);
  }

  return originalBattery;
}

