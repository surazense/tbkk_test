import { redirect } from "next/navigation";

/** The machine health page moved to /machines (cards) and /machines/[key] (detail). */
export default function MachineHealthRedirect() {
  redirect("/machines");
}
