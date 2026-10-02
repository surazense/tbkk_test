import * as z from "zod";

/** Physical accelerometer axes a logical H / V / A channel can be wired to. */
export const SENSOR_AXES = ["X", "Y", "Z"] as const;
export type SensorAxis = (typeof SENSOR_AXES)[number];
/** "" = no axis chosen (nothing stored in the database for this channel). */
export type SensorAxisValue = SensorAxis | "";

export const singleSensorSchema = z
  .object({
    serialNumber: z.string().optional(),
    area: z.string().optional(),
    motorStartTime: z.date().optional(),
    sensorType: z.string().optional(),
    machine: z.string().optional(),
    machineNo: z.string().optional(),
    installationPoint: z.string().optional(),
    machineClassEnabled: z.boolean(),
    namePlaceEnabled: z.boolean(),
    machineClass: z.string().optional(),
    namePlace: z.string().optional(),
    warningThreshold: z.string().optional(),
    concernThreshold: z.string().optional(),
    damageThreshold: z.string().optional(),
    alarmThreshold: z.string().optional(),
    gScale: z.string().optional(),
    temperatureThresholdMin: z.string().optional(),
    timeInterval: z.string().optional(),
    lor: z.string().optional(),
    frequencyMax: z.string().optional(),
    temperatureThresholdMax: z.string().optional(),
    highPass: z.string().optional(),
    motorType: z.string().optional(),
    motorRpm: z.string().optional(),
    // Axis mapping: which physical axis (X/Y/Z) each of H / V / A reads from.
    // "" means not set (the database has no value for it).
    axisH: z.enum(SENSOR_AXES).or(z.literal("")),
    axisV: z.enum(SENSOR_AXES).or(z.literal("")),
    axisA: z.enum(SENSOR_AXES).or(z.literal("")),
    notes: z.string().optional(),
    name: z.string().optional(),
    namePlaceWarningThreshold: z.string().optional(),
    namePlaceConcernThreshold: z.string().optional(),
    namePlaceDamageThreshold: z.string().optional(),
    id: z.string().optional(), // Store ID for updates
  })
  .superRefine((data, ctx) => {
    // If serial number is present (meaning the user wants to register this sensor)
    if (data.serialNumber && data.serialNumber.length > 0) {
      if (data.serialNumber.length !== 12) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Serial number (MAC) must be exactly 12 characters",
          path: ["serialNumber"],
        });
      }
      if (!data.motorStartTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Motor Start Time is required",
          path: ["motorStartTime"],
        });
      }

      // Machine Class validation
      if (data.machineClassEnabled) {
        if (!data.machineClass) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Machine Class is required",
            path: ["machineClass"],
          });
        }
        if (!data.warningThreshold) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Warning Threshold is required",
            path: ["warningThreshold"],
          });
        }
        if (!data.concernThreshold) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Concern Threshold is required",
            path: ["concernThreshold"],
          });
        }
        if (!data.damageThreshold) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Damage Threshold is required",
            path: ["damageThreshold"],
          });
        }
      }

      // Name Place validation
      if (data.namePlaceEnabled) {
        if (!data.namePlace) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Name Place (Motor Power) is required",
            path: ["namePlace"],
          });
        }
        if (!data.namePlaceWarningThreshold) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Warning Threshold is required",
            path: ["namePlaceWarningThreshold"],
          });
        }
        if (!data.namePlaceConcernThreshold) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Concern Threshold is required",
            path: ["namePlaceConcernThreshold"],
          });
        }
        if (!data.namePlaceDamageThreshold) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Damage Threshold is required",
            path: ["namePlaceDamageThreshold"],
          });
        }
      }

      if (!data.alarmThreshold) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Alarm Threshold is required",
          path: ["alarmThreshold"],
        });
      } else {
        const alarmVal = parseFloat(data.alarmThreshold);
        if (isNaN(alarmVal) || alarmVal < 0.1 || alarmVal > 16) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Alarm Threshold must be between 0.1 and 16",
            path: ["alarmThreshold"],
          });
        }
      }
      // Motor speed is optional, but when given it must be a sensible RPM
      if (data.motorRpm && data.motorRpm.trim() !== "") {
        const rpm = Number(data.motorRpm);
        if (!Number.isFinite(rpm) || rpm <= 0 || rpm > 100000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Motor Speed must be between 1 and 100000 RPM",
            path: ["motorRpm"],
          });
        }
      }
      // Axis mapping: all three channels or none, and each axis only once
      const axisChoices: Array<["axisH" | "axisV" | "axisA", SensorAxisValue]> =
        [
          ["axisH", data.axisH],
          ["axisV", data.axisV],
          ["axisA", data.axisA],
        ];
      const chosenCount = axisChoices.filter(([, axis]) => axis !== "").length;
      if (chosenCount > 0 && chosenCount < 3) {
        axisChoices.forEach(([path, axis]) => {
          if (axis === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Select all three axes, or leave them all empty",
              path: [path],
            });
          }
        });
      }
      axisChoices.forEach(([path, axis], i) => {
        if (
          axis !== "" &&
          axisChoices.findIndex(([, other]) => other === axis) !== i
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Axis ${axis} is already used by another channel`,
            path: [path],
          });
        }
      });
      if (!data.timeInterval) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Time Interval is required",
          path: ["timeInterval"],
        });
      }
      if (!data.lor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "LOR is required",
          path: ["lor"],
        });
      }
      if (!data.frequencyMax) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Frequency Max is required",
          path: ["frequencyMax"],
        });
      }
    }
  });

export const formSchema = z.object({
  sensors: z.array(singleSensorSchema),
});

export type FormValues = z.infer<typeof formSchema>;
export type SingleSensorValues = z.infer<typeof singleSensorSchema>;
