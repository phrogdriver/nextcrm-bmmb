"use client";

import { Ruler } from "lucide-react";
import { CollapsibleCard } from "@/components/crm/CollapsibleCard";

const MOCK_MEASUREMENTS = [
  { value: "28", label: "Squares" },
  { value: "4,480", label: "Total SF" },
  { value: "6/12", label: "Pitch" },
  { value: "320", label: "Ridge LF" },
  { value: "48", label: "Ridge Vent LF" },
  { value: "185", label: "Valley LF" },
  { value: "240", label: "Eave LF" },
  { value: "160", label: "Rake LF" },
  { value: "92", label: "Drip Edge LF" },
  { value: "3", label: "Pipe Boots" },
  { value: "1", label: "Chimney Flashing" },
  { value: "2", label: "Layers" },
];

export function MeasurementsCard() {
  return (
    <CollapsibleCard
      title="Measurements"
      icon={Ruler}
      summary={
        <><span className="font-mono">28</span> sq · <span className="font-mono">6/12</span> pitch · EagleView</>
      }
    >
      <div className="grid grid-cols-4 gap-3">
        {MOCK_MEASUREMENTS.map((m, i) => (
          <div key={i} className="text-center">
            <div className="text-lg font-medium font-mono leading-tight">
              {m.value}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {m.label}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t">
        <div className="text-xs text-muted-foreground">
          Source: EagleView Report · Feb 15, 2026
        </div>
      </div>
    </CollapsibleCard>
  );
}
