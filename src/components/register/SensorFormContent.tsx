"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { MUIDateTimePicker } from "@/components/ui/mui-date-time-picker";
import { AutocompleteInput } from "./AutocompleteInput";
import { FieldLabel, FormSection, FIELD_GRID, INPUT_CLASS } from "./FormSection";
import {
  getAllMachineClasses,
  getThresholdsForMachineClass,
  getMachineClassId,
} from "@/lib/iso10816-3";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  storeArea,
  storeInstallationPoint,
  storeMachineName,
  storeMachineNo,
  storeSensorName,
} from "@/lib/registerStorage";

interface SensorFormContentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  index: number;
  areaSuggestions: string[];
  machineNameSuggestions: string[];
  machineNoSuggestions: string[];
  installationPointSuggestions: string[];
  sensorNameSuggestions: string[];
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Editing an existing sensor: the serial number (MAC) is locked. */
  isEditMode?: boolean;
}

// Fields inside the collapsible "Measurement" section. If one of them fails
// validation the section opens by itself so the error is never hidden.
const MEASUREMENT_FIELDS = [
  "timeInterval",
  "gScale",
  "highPass",
  "lor",
  "frequencyMax",
  "axisH",
  "axisV",
  "axisA",
] as const;

export function SensorFormContent({
  form,
  index,
  areaSuggestions,
  machineNameSuggestions,
  machineNoSuggestions,
  installationPointSuggestions,
  sensorNameSuggestions,
  imagePreview,
  onImageChange,
  isEditMode = false,
}: SensorFormContentProps) {
  const machineClassOptions = getAllMachineClasses();

  // Sensor type options
  const sensorTypes = ["Master", "Satellite"];

  // Frequency Max options
  const frequencyMaxOptions = ["1250", "2500", "5000", "10000"];

  // LOR options
  const lorOptions = ["200", "400", "800", "1600", "3200", "6400"];

  // G-Scale options
  const defaultGScaleOptions = ["2", "4", "8", "16"];

  // Motor Type options
  const motorTypeOptions = [
    "Motor Ligid Installed",
    "Motor Flexible Installed",
    "External driver Motor pump Ligid Installed",
    "External driver Motor pump Flexible Installed",
    "Integrated driver Motor pump Ligid Installed",
    "Integrated driver Motor pump Flexible Installed",
  ];

  // Time Interval options
  const defaultTimeIntervalOptions = [
    { label: "2 min", value: "2" },
    { label: "5 min", value: "5" },
    { label: "10 min", value: "10" },
    { label: "30 min", value: "30" },
    { label: "1 Hr", value: "60" },
    { label: "2 Hr", value: "120" },
    { label: "4 Hr", value: "240" },
    { label: "8 Hr", value: "480" },
    { label: "12 Hr", value: "720" },
    { label: "24 Hr", value: "1440" },
  ];

  const watchedMachineClassEnabled = form.watch(
    `sensors.${index}.machineClassEnabled`
  );
  const watchedNamePlaceEnabled = form.watch(
    `sensors.${index}.namePlaceEnabled`
  );

  const watchedTimeInterval = form.watch(`sensors.${index}.timeInterval`);

  // Ensure the current time interval value is in the options list so it displays correctly
  const timeIntervalOptions = [...defaultTimeIntervalOptions];
  if (
    watchedTimeInterval &&
    !defaultTimeIntervalOptions.some((opt) => opt.value === watchedTimeInterval)
  ) {
    timeIntervalOptions.push({
      label: `${watchedTimeInterval} min (Custom)`,
      value: watchedTimeInterval,
    });
  }

  const watchedGScale = form.watch(`sensors.${index}.gScale`);

  // Ensure the current G-Scale value is in the options list so it displays correctly
  const gScaleOptions = [...defaultGScaleOptions];
  if (watchedGScale && !defaultGScaleOptions.includes(watchedGScale)) {
    gScaleOptions.push(watchedGScale);
  }

  // Auto-fill thresholds only when the user picks a machine class. Doing this in
  // an effect would also fire when the edit page loads a saved class and
  // overwrite thresholds that were customised after registration.
  const handleMachineClassChange = (machineClass: string) => {
    form.setValue(`sensors.${index}.machineClass`, machineClass, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const thresholds = getThresholdsForMachineClass(machineClass);
    if (thresholds) {
      form.setValue(
        `sensors.${index}.warningThreshold`,
        thresholds.warning.toString()
      );
      form.setValue(
        `sensors.${index}.concernThreshold`,
        thresholds.concern.toString()
      );
      form.setValue(
        `sensors.${index}.damageThreshold`,
        thresholds.critical.toString()
      );
    }
  };

  // Watch temperature threshold max to update min
  const watchedTempMax = form.watch(`sensors.${index}.temperatureThresholdMax`);

  useEffect(() => {
    if (watchedTempMax) {
      const maxVal = parseFloat(watchedTempMax);
      if (!isNaN(maxVal)) {
        form.setValue(
          `sensors.${index}.temperatureThresholdMin`,
          (maxVal - 2).toString()
        );
      }
    } else {
      form.setValue(`sensors.${index}.temperatureThresholdMin`, "");
    }
  }, [watchedTempMax, form, index]);

  // Measurement section: collapsed by default, opens itself on validation errors
  const [measurementOpen, setMeasurementOpen] = useState(false);
  const sensorErrors = (
    form.formState.errors.sensors as
      | Record<number, Record<string, unknown> | undefined>
      | undefined
  )?.[index];
  const hasMeasurementError = MEASUREMENT_FIELDS.some(
    (name) => !!sensorErrors?.[name]
  );
  useEffect(() => {
    if (hasMeasurementError) setMeasurementOpen(true);
  }, [hasMeasurementError]);

  const watchedLor = form.watch(`sensors.${index}.lor`);
  const watchedFmax = form.watch(`sensors.${index}.frequencyMax`);
  const watchedAxisH = form.watch(`sensors.${index}.axisH`);
  const watchedAxisV = form.watch(`sensors.${index}.axisV`);
  const watchedAxisA = form.watch(`sensors.${index}.axisA`);
  const intervalLabel = timeIntervalOptions.find(
    (option) => option.value === watchedTimeInterval
  )?.label;
  const measurementSummary = [
    intervalLabel && `Every ${intervalLabel}`,
    watchedGScale && `${watchedGScale} G`,
    watchedLor && `LOR ${watchedLor}`,
    watchedFmax && `${watchedFmax} Hz`,
    watchedAxisH &&
      watchedAxisV &&
      watchedAxisA &&
      `H=${watchedAxisH}, V=${watchedAxisV}, A=${watchedAxisA}`,
  ].filter(Boolean) as string[];

  return (
    <div className="py-2">
      <FormSection
        first
        title="Sensor"
        description="Which device this is and where it is mounted."
      >
        <div className={FIELD_GRID}>
          <FormField
            control={form.control}
            name={`sensors.${index}.serialNumber`}
            render={({ field }) => (
              <FormItem>
                <FieldLabel required={!isEditMode && index === 0}>
                  Serial number (MAC)
                </FieldLabel>
                <FormControl>
                  <Input
                    placeholder="Enter serial number"
                    className={`${INPUT_CLASS} ${isEditMode ? "cursor-not-allowed opacity-60" : ""}`}
                    readOnly={isEditMode}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      if (
                        form.getFieldState(`sensors.${index}.serialNumber`)
                          .invalid
                      ) {
                        form.clearErrors(`sensors.${index}.serialNumber`);
                      }
                    }}
                    onBlur={async (e) => {
                      field.onBlur();
                      // The serial number of the sensor being edited always
                      // exists, so there is nothing to check.
                      if (isEditMode) return;
                      const value = e.target.value;
                      if (!value) return;

                      try {
                        const { getSensors } = await import(
                          "@/lib/data/sensors"
                        );
                        const { sensors } = await getSensors({ search: value });
                        const exists = sensors.some(
                          (s) =>
                            s.serialNumber.toLowerCase() === value.toLowerCase()
                        );
                        if (exists) {
                          form.setError(`sensors.${index}.serialNumber`, {
                            type: "manual",
                            message: "Serial Number นี้มีอยู่ในฐานข้อมูลอยู่แล้ว",
                          });
                        }
                      } catch (err) {
                        console.error("Error validating serial number:", err);
                      }
                    }}
                  />
                </FormControl>
                {isEditMode ? (
                  <FormDescription>Can&apos;t be changed.</FormDescription>
                ) : index > 0 ? (
                  <FormDescription>
                    Leave empty to skip this satellite.
                  </FormDescription>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`sensors.${index}.name`}
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Sensor name</FieldLabel>
                <FormControl>
                  <AutocompleteInput
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      if (value) {
                        storeSensorName(value);
                      }
                    }}
                    suggestions={sensorNameSuggestions}
                    placeholder="Enter sensor name"
                    onStoreValue={storeSensorName}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`sensors.${index}.installationPoint`}
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Installation point</FieldLabel>
                <FormControl>
                  <AutocompleteInput
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      if (value) {
                        storeInstallationPoint(value);
                      }
                    }}
                    suggestions={installationPointSuggestions}
                    placeholder="Enter installation point"
                    onStoreValue={storeInstallationPoint}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`sensors.${index}.notes`}
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FieldLabel>Note</FieldLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter any additional notes..."
                    className="box-border bg-[#080808] border-[1px] border-[#4B5563] text-white text-sm"
                    {...field}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image Upload */}
          <div className="space-y-2">
            <FormLabel className="text-xs font-medium text-gray-200 sm:text-sm">
              Sensor image (optional)
            </FormLabel>
            <div className="flex items-center gap-3">
              <label
                htmlFor={`sensor-image-${index}`}
                className="flex h-9 cursor-pointer items-center rounded-md border bg-white px-4 text-sm font-semibold text-black hover:bg-gray-100"
              >
                {imagePreview ? "Change image" : "Add image"}
              </label>
              <input
                id={`sensor-image-${index}`}
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
              />
              {imagePreview && (
                <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                  <Image
                    src={imagePreview}
                    alt="Sensor preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Machine and motor"
        description="Motor speed is optional. It enables the Order (X) axis on the spectrum."
      >
        <div className={FIELD_GRID}>
          <FormField
            control={form.control}
            name={`sensors.${index}.area`}
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Area</FieldLabel>
                <FormControl>
                  <AutocompleteInput
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      if (value) {
                        storeArea(value);
                      }
                    }}
                    suggestions={areaSuggestions}
                    placeholder="Enter area"
                    onStoreValue={storeArea}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`sensors.${index}.machine`}
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Machine</FieldLabel>
                <FormControl>
                  <AutocompleteInput
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      if (value) {
                        storeMachineName(value);
                      }
                    }}
                    suggestions={machineNameSuggestions}
                    placeholder="Enter machine name"
                    onStoreValue={storeMachineName}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`sensors.${index}.machineNo`}
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Machine number</FieldLabel>
                <FormControl>
                  <AutocompleteInput
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      if (value) {
                        storeMachineNo(value);
                      }
                    }}
                    suggestions={machineNoSuggestions}
                    placeholder="Enter machine number"
                    onStoreValue={storeMachineNo}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`sensors.${index}.motorStartTime`}
            render={({ field }) => (
              <FormItem>
                <FieldLabel required>Motor start time</FieldLabel>
                <FormControl>
                  <MUIDateTimePicker
                    value={field.value}
                    onChange={(date) => {
                      field.onChange(date);
                    }}
                    label=""
                    className="bg-[#080808] border-[1px] border-[#4B5563] text-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Motor speed: used to convert the spectrum X axis to CPM / Order */}
          <FormField
            control={form.control}
            name={`sensors.${index}.motorRpm`}
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Motor speed (RPM)</FieldLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    placeholder="e.g. 1485"
                    className={INPUT_CLASS}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </FormSection>

      <FormSection
        title="Alarm thresholds"
        description="Use a machine class, or enter values from the motor name plate."
      >
      {/* Options - Machine Class and Name Place */}
      <div className="flex items-center gap-6">
        <FormField
          control={form.control}
          name={`sensors.${index}.machineClassEnabled`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-[#374151] bg-transparent"
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (checked) {
                      form.setValue(`sensors.${index}.namePlaceEnabled`, false);
                    }
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-xs sm:text-lg 2xl:text-xl font-bold">
                  Machine Class
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`sensors.${index}.namePlaceEnabled`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-[#374151] bg-transparent"
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (checked) {
                      form.setValue(
                        `sensors.${index}.machineClassEnabled`,
                        false
                      );
                    }
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none flex items-center gap-2">
                <FormLabel className="text-xs sm:text-lg 2xl:text-xl font-bold">
                  Name Place
                </FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#3B82F6] text-white border-none p-4 max-w-sm">
                      <div className="space-y-2">
                        <p className="font-semibold text-sm sm:text-lg">
                          You can choose between:
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-sm">
                          <li>
                            <span className="font-semibold">
                              Machine Class (ISO10816-3)
                            </span>{" "}
                            | Use standard values based on machine type
                          </li>
                          <li>
                            <span className="font-semibold">Name Plate</span> |
                            Enter values according to the motor&apos;s
                            specification
                          </li>
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </FormItem>
          )}
        />
      </div>

      {/* Machine Class Section */}
      {watchedMachineClassEnabled && (
        <div className="p-4 border-[1.35px] border-[#374151] rounded-lg bg-[#0B1121] space-y-4">
          <FormField
            control={form.control}
            name={`sensors.${index}.machineClass`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs sm:text-lg 2xl:text-xl font-bold">
                  Machine Class
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#3B82F6] text-white border-none">
                        <p>Select machine class to auto-fill thresholds</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <Select
                  onValueChange={handleMachineClassChange}
                  value={
                    field.value ? getMachineClassId(field.value) : undefined
                  }
                >
                  <FormControl>
                    <SelectTrigger className="bg-[#080808] border-[1px] border-[#4B5563] text-white">
                      <SelectValue placeholder="Select machine class" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#0B1121] border-[#374151] text-white max-w-[calc(100vw-2rem)] sm:min-w-[540px]">
                    {machineClassOptions.map((option) => (
                      <SelectItem
                        key={option.id}
                        value={option.id}
                        className="py-2 cursor-pointer focus:bg-[#1f2937] focus:text-white"
                      >
                        <span className="flex items-center w-full text-xs sm:text-sm text-white">
                          <span className="w-[280px] sm:w-[320px] shrink-0 text-left font-medium text-white flex items-center pr-2">
                            <span className="text-white mr-2 shrink-0 select-none">
                              •
                            </span>
                            <span className="truncate">
                              {option.baseName || option.name}
                            </span>
                          </span>
                          <span className="text-white font-mono text-xs sm:text-sm text-left shrink-0 whitespace-nowrap">
                            {option.powerRange}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Thresholds - Three Boxes */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4 px-1 sm:px-12">
            <div className="p-2 sm:p-4 border border-[#374151] rounded-lg bg-[#0B1121]">
              <FormField
                control={form.control}
                name={`sensors.${index}.warningThreshold`}
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center space-y-1 sm:space-y-4">
                    <FormLabel className="text-xs sm:text-lg 2xl:text-xl font-bold text-center flex items-center justify-center gap-1">
                      Warning Threshold
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#3B82F6] text-white border-none">
                            <p>Warning threshold level</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder=""
                        className="bg-[#080808] border-[1px] border-[#4B5563] text-white w-16 sm:w-32 text-center h-8 sm:h-10 text-base sm:text-xl"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-sm text-muted-foreground">mm/s</div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-2 sm:p-4 border border-[#374151] rounded-lg bg-[#0B1121]">
              <FormField
                control={form.control}
                name={`sensors.${index}.concernThreshold`}
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center space-y-1 sm:space-y-4">
                    <FormLabel className="text-xs sm:text-lg 2xl:text-xl font-bold text-center flex items-center justify-center gap-1">
                      Concern Threshold
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#3B82F6] text-white border-none">
                            <p>Concern threshold level</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder=""
                        className="bg-[#080808] border-[1px] border-[#4B5563] text-white w-16 sm:w-32 text-center h-8 sm:h-10 text-base sm:text-xl"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-sm text-muted-foreground">mm/s</div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-2 sm:p-4 border border-[#374151] rounded-lg bg-[#0B1121]">
              <FormField
                control={form.control}
                name={`sensors.${index}.damageThreshold`}
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center space-y-1 sm:space-y-4">
                    <FormLabel className="text-xs sm:text-lg 2xl:text-xl font-bold text-center flex items-center justify-center gap-1">
                      Damage Threshold
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#3B82F6] text-white border-none">
                            <p>Damage threshold level</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder=""
                        className="bg-[#080808] border-[1px] border-[#4B5563] text-white w-16 sm:w-32 text-center h-8 sm:h-10 text-base sm:text-xl"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-sm text-muted-foreground">mm/s</div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      )}

      {watchedNamePlaceEnabled && (
        <div className="p-6 border-[1.35px] border-[#374151] rounded-xl bg-[#0B1121] space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField
              control={form.control}
              name={`sensors.${index}.namePlace`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-xs sm:text-lg 2xl:text-xl font-bold">
                    Motor Power (kW)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#3B82F6] text-white border-none">
                          <p>Specify the motor power for this sensor</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter motor power"
                      className="bg-[#080808] border-[1px] border-[#4B5563] text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`sensors.${index}.motorType`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-xs sm:text-lg 2xl:text-xl font-bold">
                    Motor Type
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#3B82F6] text-white border-none">
                          <p>Select the motor type</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-[#080808] border-[1px] border-[#4B5563] text-white">
                        <SelectValue placeholder="Select motor type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {motorTypeOptions.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Thresholds - Three Boxes (UI only) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4 px-1 sm:px-12">
            <div className="p-2 sm:p-4 border border-[#374151] rounded-lg bg-[#0B1121]">
              <FormField
                control={form.control}
                name={`sensors.${index}.namePlaceWarningThreshold`}
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center space-y-1 sm:space-y-4">
                    <FormLabel className="text-xs sm:text-lg 2xl:text-xl font-bold text-center flex items-center justify-center gap-2">
                      Warning Threshold
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#3B82F6] text-white border-none">
                            <p>Warning threshold level</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder=""
                        className="bg-[#080808] border-[1px] border-[#4B5563] text-white w-32 text-center h-10 text-xl"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-sm text-muted-foreground">mm/s</div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-2 sm:p-4 border border-[#374151] rounded-lg bg-[#0B1121]">
              <FormField
                control={form.control}
                name={`sensors.${index}.namePlaceConcernThreshold`}
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center space-y-1 sm:space-y-4">
                    <FormLabel className="text-xs sm:text-lg 2xl:text-xl font-bold text-center flex items-center justify-center gap-2">
                      Concern Threshold
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#3B82F6] text-white border-none">
                            <p>Concern threshold level</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder=""
                        className="bg-[#080808] border-[1px] border-[#4B5563] text-white w-16 sm:w-32 text-center h-8 sm:h-10 text-base sm:text-xl"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-sm text-muted-foreground">mm/s</div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-2 sm:p-4 border border-[#374151] rounded-lg bg-[#0B1121]">
              <FormField
                control={form.control}
                name={`sensors.${index}.namePlaceDamageThreshold`}
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center space-y-1 sm:space-y-4">
                    <FormLabel className="text-xs sm:text-lg 2xl:text-xl font-bold text-center flex items-center justify-center gap-2">
                      Damage Threshold
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#3B82F6] text-white border-none">
                            <p>Damage threshold level</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder=""
                        className="bg-[#080808] border-[1px] border-[#4B5563] text-white w-16 sm:w-32 text-center h-8 sm:h-10 text-base sm:text-xl"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-sm text-muted-foreground">mm/s</div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      )}

        <div className={FIELD_GRID}>
          <FormField
            control={form.control}
            name={`sensors.${index}.alarmThreshold`}
            render={({ field }) => (
              <FormItem>
                <FieldLabel required>Alarm threshold (g)</FieldLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min={0.1}
                    max={16}
                    placeholder="0.0"
                    className={INPUT_CLASS}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Minimum G-force that activates the sensor.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`sensors.${index}.temperatureThresholdMax`}
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Temperature max (°C)</FieldLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    className={INPUT_CLASS}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`sensors.${index}.temperatureThresholdMin`}
            render={({ field }) => (
              <FormItem>
                <FieldLabel>Temperature min (°C)</FieldLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    className={`${INPUT_CLASS} opacity-70`}
                    readOnly
                    {...field}
                  />
                </FormControl>
                <FormDescription>Set automatically: max minus 2.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </FormSection>

      <FormSection title="Measurement" description="Defaults suit most sensors.">
        <details
          open={measurementOpen}
          onToggle={(e) => setMeasurementOpen(e.currentTarget.open)}
        >
          <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
            <div className="flex flex-wrap gap-1.5">
              {measurementSummary.map((text) => (
                <span
                  key={text}
                  className="rounded-md bg-[#1f2937] px-2.5 py-1 text-xs text-gray-300"
                >
                  {text}
                </span>
              ))}
            </div>
            <span className="ml-auto shrink-0 text-xs text-blue-400">
              {measurementOpen ? "Hide" : "Show"}
            </span>
          </summary>

          <div className="mt-4 space-y-4">
            <div className={FIELD_GRID}>
              <FormField
                control={form.control}
                name={`sensors.${index}.timeInterval`}
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>Time interval</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={INPUT_CLASS}>
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#0B1121] border-[#374151] text-white">
                        {timeIntervalOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Time between readings.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`sensors.${index}.gScale`}
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>G-scale</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={INPUT_CLASS}>
                          <SelectValue placeholder="Select G-scale" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {gScaleOptions.map((scale) => (
                          <SelectItem key={scale} value={scale}>
                            {scale} G
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Maximum measurable acceleration.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`sensors.${index}.highPass`}
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>High pass filter (Hz)</FieldLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="10"
                        className={INPUT_CLASS}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`sensors.${index}.lor`}
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>LOR</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={INPUT_CLASS}>
                          <SelectValue placeholder="Select LOR" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lorOptions.map((lor) => (
                          <SelectItem key={lor} value={lor}>
                            {lor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Lines of resolution of the FFT.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`sensors.${index}.frequencyMax`}
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>Frequency max (Hz)</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={INPUT_CLASS}>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {frequencyMaxOptions.map((freq) => (
                          <SelectItem key={freq} value={freq}>
                            {freq} Hz
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Axis mapping: which physical axis (X/Y/Z) feeds each of H / V / A */}
            <div className="space-y-2 border-t border-[#1f2937] pt-4">
              <p className="text-xs text-gray-400 sm:text-sm">
                Axis mapping: which sensor axis (X, Y or Z) is reported as each
                channel. Each axis can be used once.
              </p>
              <div className={FIELD_GRID}>
                {(
                  [
                    ["axisH", "H (horizontal) axis"],
                    ["axisV", "V (vertical) axis"],
                    ["axisA", "A (axial) axis"],
                  ] as const
                ).map(([fieldName, label]) => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={`sensors.${index}.${fieldName}`}
                    render={({ field }) => (
                      <FormItem>
                        <FieldLabel>{label}</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className={INPUT_CLASS}>
                              <SelectValue placeholder="Select axis" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["X", "Y", "Z"].map((axis) => (
                              <SelectItem key={axis} value={axis}>
                                {axis} axis
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {isEditMode && (
              <p className="border-l-2 border-blue-500 bg-[#0B1121] px-3 py-2 text-xs leading-relaxed text-gray-300">
                Frequency max and LOR apply to new readings. Older readings keep
                the settings they were recorded with.
              </p>
            )}
          </div>
        </details>
      </FormSection>
    </div>
  );
}
