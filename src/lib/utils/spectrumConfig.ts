/**
 * Which fmax / lor to use when drawing ONE stored reading.
 *
 * The device sends frequency BIN INDEXES; the backend converts them to Hz when
 * the reading is saved: f_point = index * fmax / lor, using the sensor's config
 * at that moment. Hz per bin (fmax / lor) is therefore frozen inside f_point.
 *
 * If the chart used the sensor's CURRENT fmax/lor instead, a reading taken
 * before the config was edited would show a different frequency on the chart
 * than in the peak table (which uses f_point). The same happens to old rows
 * whose fmax/lor were back-filled with a default.
 *
 * So: trust the row's own fmax/lor when it agrees with f_point, otherwise
 * rebuild fmax from the Hz-per-bin that f_point proves.
 */

const AGREEMENT_TOLERANCE = 1e-3; // 0.1 %

export type SpectrumConfigSource =
  | "row" // fmax/lor stored with the reading, agrees with f_point (or no f_point)
  | "current" // sensor's current config, agrees with f_point / row has none
  | "measured"; // neither agrees: fmax rebuilt from f_point

export interface SpectrumConfigInput {
  /** fmax / lor stored on the sensor_data row (may be null on old rows). */
  rowFmax?: number | null;
  rowLor?: number | null;
  /** The sensor's current config. */
  currentFmax?: number | null;
  currentLor?: number | null;
  /** Raw bin indexes sent by the device, one list per axis (H, V, A). */
  freqIndexes?: Array<number[] | null | undefined>;
  /** F-Point (Hz) saved by the backend, same order/length as freqIndexes. */
  fPointsHz?: Array<number[] | null | undefined>;
}

export interface SpectrumConfig {
  fmax: number;
  lor: number;
  source: SpectrumConfigSource;
}

const isPositive = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0;

/** Hz per bin proven by the stored F-Point, or null if it can't be measured. */
export function measureBinWidthHz(
  freqIndexes: SpectrumConfigInput["freqIndexes"],
  fPointsHz: SpectrumConfigInput["fPointsHz"]
): number | null {
  if (!freqIndexes || !fPointsHz) return null;
  for (let axis = 0; axis < freqIndexes.length; axis++) {
    const idx = freqIndexes[axis];
    const hz = fPointsHz[axis];
    if (!idx || !hz) continue;
    const n = Math.min(idx.length, hz.length);
    for (let i = 0; i < n; i++) {
      if (isPositive(idx[i]) && isPositive(hz[i])) return hz[i] / idx[i];
    }
  }
  return null;
}

function agrees(fmax: number, lor: number, binWidthHz: number): boolean {
  return Math.abs(fmax / lor - binWidthHz) <= binWidthHz * AGREEMENT_TOLERANCE;
}

export function resolveSpectrumConfig(
  input: SpectrumConfigInput
): SpectrumConfig | null {
  const row =
    isPositive(input.rowFmax) && isPositive(input.rowLor)
      ? { fmax: input.rowFmax, lor: input.rowLor }
      : null;
  const current =
    isPositive(input.currentFmax) && isPositive(input.currentLor)
      ? { fmax: input.currentFmax, lor: input.currentLor }
      : null;
  const binWidthHz = measureBinWidthHz(input.freqIndexes, input.fPointsHz);

  if (binWidthHz === null) {
    // Nothing to cross-check against: prefer the reading's own values.
    if (row) return { ...row, source: "row" };
    if (current) return { ...current, source: "current" };
    return null;
  }

  if (row && agrees(row.fmax, row.lor, binWidthHz)) {
    return { ...row, source: "row" };
  }
  if (current && agrees(current.fmax, current.lor, binWidthHz)) {
    return { ...current, source: "current" };
  }

  const lor = row?.lor ?? current?.lor;
  if (!lor) return null;
  return { fmax: binWidthHz * lor, lor, source: "measured" };
}
