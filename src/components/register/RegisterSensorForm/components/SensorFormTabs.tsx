import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../schema";

interface SensorFormTabsProps {
  editId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
}

export function SensorFormTabs({ editId, form }: SensorFormTabsProps) {
  if (editId) return null;

  return (
    <TabsList className="flex w-full justify-start bg-transparent p-0">
      <TabsTrigger
        value="master"
        className="rounded-none border-b-2 border-transparent px-2 sm:px-6 py-2 sm:py-3 text-sm sm:text-xl font-bold data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        Master
      </TabsTrigger>
      <TabsTrigger
        value="sat1"
        className="rounded-none border-b-2 border-transparent px-2 sm:px-6 py-2 sm:py-3 text-sm sm:text-xl font-bold data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        Satellite 1
      </TabsTrigger>
      <TabsTrigger
        value="sat2"
        className="rounded-none border-b-2 border-transparent px-2 sm:px-6 py-2 sm:py-3 text-sm sm:text-xl font-bold data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        Satellite 2
      </TabsTrigger>
      <TabsTrigger
        value="sat3"
        className="rounded-none border-b-2 border-transparent px-2 sm:px-6 py-2 sm:py-3 text-sm sm:text-xl font-bold data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        Satellite 3
      </TabsTrigger>
    </TabsList>
  );
}
