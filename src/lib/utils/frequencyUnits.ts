/**
 * Spectrum X-axis units.
 *  - Hz    : cycles per second (as measured)
 *  - CPM   : cycles per minute  = Hz * 60
 *  - Order : multiples of the motor running speed (1X = running speed)
 *            = Hz / (RPM / 60) = Hz * 60 / RPM
 */
export type FrequencyUnit = "Hz" | "CPM" | "Order";

export const FREQUENCY_UNITS: FrequencyUnit[] = ["Hz", "CPM", "Order"];

/** Motor speed usable for the Order conversion, or null when not set/invalid. */
export function getValidMotorRpm(
  rpm: number | string | null | undefined
): number | null {
  const value = Number(rpm);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Order needs the motor speed; without it fall back to Hz. */
export function resolveFrequencyUnit(
  unit: FrequencyUnit,
  motorRpm: number | null
): FrequencyUnit {
  return unit === "Order" && !motorRpm ? "Hz" : unit;
}

export function convertFrequency(
  hz: number,
  unit: FrequencyUnit,
  motorRpm: number | null
): number {
  if (unit === "CPM") return hz * 60;
  if (unit === "Order") return motorRpm ? (hz * 60) / motorRpm : hz;
  return hz;
}

/** Short suffix shown after a value, e.g. "12.50 Hz", "750.0 CPM", "1.00 X". */
export function getFrequencyUnitSuffix(unit: FrequencyUnit): string {
  return unit === "Order" ? "X" : unit;
}

/** X-axis title for the spectrum chart. */
export function getFrequencyAxisTitle(unit: FrequencyUnit): string {
  if (unit === "CPM") return "Frequency (CPM)";
  if (unit === "Order") return "Order (X)";
  return "Frequency (Hz)";
}

export function formatFrequencyValue(
  hz: number,
  unit: FrequencyUnit,
  motorRpm: number | null
): string {
  const converted = convertFrequency(hz, unit, motorRpm);
  if (!Number.isFinite(converted)) return "-";
  return converted.toFixed(unit === "CPM" ? 1 : 2);
}
