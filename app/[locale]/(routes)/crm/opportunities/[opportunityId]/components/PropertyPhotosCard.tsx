"use client";

import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleCard } from "@/components/crm/CollapsibleCard";

const MOCK_PHOTOS = [
  { label: "Front elevation", color: "bg-slate-400" },
  { label: "Roof overview", color: "bg-slate-500" },
  { label: "Hail damage — north slope", color: "bg-slate-600" },
  { label: "Hail damage — south slope", color: "bg-amber-800/60" },
  { label: "Valley detail", color: "bg-green-800/50" },
  { label: "Flashing — chimney", color: "bg-slate-500/80" },
  { label: "Pipe boots", color: "bg-purple-800/40" },
];

const TOTAL_PHOTOS = 100;
const REMAINING = TOTAL_PHOTOS - MOCK_PHOTOS.length;

export function PropertyPhotosCard({ address }: { address?: string }) {
  return (
    <CollapsibleCard
      title="Property Photos"
      icon={Camera}
      summary={
        <>{address ?? "Property"} · {TOTAL_PHOTOS} photos</>
      }
      actions={
        <Button variant="outline" size="sm">
          <Upload className="h-3.5 w-3.5 mr-1" />
          Upload photos
        </Button>
      }
    >
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
        {MOCK_PHOTOS.map((photo, i) => (
          <div
            key={i}
            className={`aspect-[4/3] rounded-md relative overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${photo.color}`}
          >
            <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/60 to-transparent">
              <span className="text-[11px] font-medium text-white truncate block">
                {photo.label}
              </span>
            </div>
          </div>
        ))}
        {/* +N more tile */}
        <div
          className="aspect-[4/3] rounded-md flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
          style={{ background: "var(--brand, #1B2A4A)" }}
        >
          <span className="text-2xl font-bold text-white leading-none">
            +{REMAINING}
          </span>
          <span className="text-[11px] text-white/70 mt-0.5">View all</span>
        </div>
      </div>
    </CollapsibleCard>
  );
}
