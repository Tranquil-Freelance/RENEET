import { redirect } from "next/navigation";

/** Dashboard entry now opens the SWOT gap-analysis hub directly. */
export default function DashboardPage() {
  redirect("/swot");
}
