import type { Metadata } from "next";
import { TripWizard } from "@/components/trip/TripWizard";

export const metadata: Metadata = {
  title: "Build Your Trip — TabiNav",
  description: "Customize your Tokyo itinerary in seconds.",
};

export default function BuildPage() {
  return <TripWizard />;
}
