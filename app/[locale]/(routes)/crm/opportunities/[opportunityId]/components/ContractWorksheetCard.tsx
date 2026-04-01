"use client";

import { FileText } from "lucide-react";
import { CollapsibleCard } from "@/components/crm/CollapsibleCard";

const MOCK_LINE_ITEMS = [
  { desc: "Tear-off existing shingles (28 sq)", cash: null, insurance: 3360, upgrade: null, supplement: null, notDoing: null },
  { desc: "Install GAF Timberline HDZ shingles", cash: null, insurance: 5880, upgrade: null, supplement: 1200, notDoing: null },
  { desc: "Synthetic underlayment", cash: null, insurance: 1680, upgrade: null, supplement: null, notDoing: null },
  { desc: "Ridge vent (48 LF)", cash: null, insurance: 960, upgrade: null, supplement: 480, notDoing: null },
  { desc: "Ice & water shield (valleys + eaves)", cash: null, insurance: 1120, upgrade: null, supplement: 620, notDoing: null },
  { desc: "Drip edge (aluminum)", cash: null, insurance: 480, upgrade: null, supplement: null, notDoing: null },
  { desc: "Upgrade: Charcoal → Weathered Wood", cash: null, insurance: null, upgrade: 350, supplement: null, notDoing: null },
  { desc: "Pipe boots & flashing", cash: null, insurance: 720, upgrade: null, supplement: 280, notDoing: null },
  { desc: "Gutter replacement (not doing)", cash: null, insurance: 1200, upgrade: null, supplement: null, notDoing: -1200 },
  { desc: "Dump & haul-off", cash: null, insurance: 680, upgrade: -150, supplement: 420, notDoing: null },
];

function fmtCell(v: number | null): string {
  if (v == null) return "—";
  if (v < 0) return `(${Math.abs(v).toLocaleString("en-US", { style: "currency", currency: "USD" })})`;
  return v.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function computeInsTotal(row: typeof MOCK_LINE_ITEMS[0]): number | null {
  const ins = (row.insurance ?? 0) + (row.supplement ?? 0) + (row.notDoing ?? 0);
  return ins === 0 && !row.insurance ? null : ins;
}

function computeItemTotal(row: typeof MOCK_LINE_ITEMS[0]): number | null {
  const t = (row.cash ?? 0) + (row.insurance ?? 0) + (row.upgrade ?? 0) + (row.supplement ?? 0) + (row.notDoing ?? 0);
  return t === 0 ? null : t;
}

export function ContractWorksheetCard() {
  const insTotal = MOCK_LINE_ITEMS.reduce((s, r) => s + (computeInsTotal(r) ?? 0), 0);
  const estTotal = MOCK_LINE_ITEMS.reduce((s, r) => s + (computeItemTotal(r) ?? 0), 0);

  return (
    <CollapsibleCard
      title="Contract Worksheet"
      icon={FileText}
      summary={
        <>{MOCK_LINE_ITEMS.length} items · Est. <span className="font-mono">${estTotal.toLocaleString()}</span> · Ins. <span className="font-mono">${insTotal.toLocaleString()}</span></>
      }
    >
      <div className="overflow-x-auto -mx-4">
        <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr className="border-b-2">
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]" style={{ width: "30%" }}>Description</th>
              <th className="text-right px-2 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]" style={{ width: "10%" }}>Cash</th>
              <th className="text-right px-2 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]" style={{ width: "10%" }}>Insurance</th>
              <th className="text-right px-2 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]" style={{ width: "10%" }}>Upgr/Disc</th>
              <th className="text-right px-2 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]" style={{ width: "10%" }}>Suppl.</th>
              <th className="text-right px-2 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px]" style={{ width: "10%" }}>Not Doing</th>
              <th className="text-right px-2 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px] bg-primary/5" style={{ width: "10%" }}>Ins. Total</th>
              <th className="text-right px-2 py-2 font-semibold text-muted-foreground uppercase tracking-wide text-[10px] bg-foreground/5" style={{ width: "10%" }}>Item Total</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_LINE_ITEMS.map((row, i) => {
              const insT = computeInsTotal(row);
              const itemT = computeItemTotal(row);
              return (
                <tr key={i} className="border-b hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium truncate">{row.desc}</td>
                  <td className="px-2 py-2 text-right font-mono text-muted-foreground/40">{fmtCell(row.cash)}</td>
                  <td className="px-2 py-2 text-right font-mono">{fmtCell(row.insurance)}</td>
                  <td className="px-2 py-2 text-right font-mono">{fmtCell(row.upgrade)}</td>
                  <td className="px-2 py-2 text-right font-mono">{fmtCell(row.supplement)}</td>
                  <td className="px-2 py-2 text-right font-mono">{fmtCell(row.notDoing)}</td>
                  <td className="px-2 py-2 text-right font-mono bg-primary/5">{fmtCell(insT)}</td>
                  <td className="px-2 py-2 text-right font-mono font-medium bg-foreground/5">{fmtCell(itemT)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-8 pt-3 border-t-2 mt-1">
        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Insurance Total</div>
          <div className="text-base font-mono font-medium text-primary">${insTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Estimated Total</div>
          <div className="text-base font-mono font-medium">${estTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
      </div>
    </CollapsibleCard>
  );
}
