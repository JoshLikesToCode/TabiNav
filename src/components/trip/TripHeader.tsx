import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, MapPin, Wallet } from "lucide-react";
import type { Trip } from "@/lib/types";
import { BUDGET_LABELS } from "@/lib/utils";
import { ShareButton } from "./ShareButton";

interface TripHeaderProps {
  trip: Trip;
}

export function TripHeader({ trip }: TripHeaderProps) {
  const cityLabel = trip.city.charAt(0).toUpperCase() + trip.city.slice(1);

  return (
    <header className="z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3 shadow-sm sm:px-6">
      <div className="flex items-center gap-3">
        <Link
          href="/build"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Edit trip</span>
        </Link>
        <span className="text-muted-foreground/40">|</span>
        <Image
          src="/images/tabinav-logo.png"
          alt="TabiNav"
          height={80}
          width={120}
          className="h-20 w-auto"
        />
      </div>

      {/* Trip meta — hidden on mobile to save space */}
      <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {cityLabel}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {trip.days} day{trip.days !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <Wallet className="h-3 w-3" />
          {BUDGET_LABELS[trip.budget]}
        </span>
      </div>

      <ShareButton />
    </header>
  );
}
