import type { Metadata } from "next";
import { TripViewer } from "@/components/trip/TripViewer";

export const metadata: Metadata = {
  title: "Your Trip — TabiNav",
  description: "Your personalized Japan itinerary, shareable with anyone.",
};

// Rendering is 100% client-side (reads URL hash after mount).
// Static export is safe — no server data needed.
export default function TripPage() {
  return <TripViewer />;
}
