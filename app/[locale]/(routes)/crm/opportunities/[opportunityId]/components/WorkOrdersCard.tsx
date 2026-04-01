"use client";

import { ClipboardList, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollapsibleCard } from "@/components/crm/CollapsibleCard";

function SummaryBar() {
  const items = [
    { label: "COMMITTED", value: "$12,840", sub: "Open POs" },
    { label: "BILLED", value: "$9,650", sub: "Bills + Expenses" },
    { label: "PAID OUT", value: "$8,400", sub: "Total disbursed", color: "text-destructive" },
    { label: "VENDOR CREDITS", value: "$320", sub: "Applied to bills", color: "text-green-600" },
  ];

  return (
    <div className="flex items-center rounded-md bg-muted/50 mx-0 mb-3">
      {items.map((item, i) => (
        <div key={i} className="flex-1 text-center py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {item.label}
          </div>
          <div className={`text-base font-medium font-mono ${item.color ?? ""}`}>
            {item.value}
          </div>
          <div className="text-[9px] uppercase tracking-wide text-muted-foreground mt-0.5">
            {item.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

function POsTab() {
  const pos = [
    {
      title: "Roof Install — Peak Roofing Crew",
      status: "Dispatched",
      statusColor: "bg-blue-50 border-blue-200 text-blue-600",
      detail: "PO-23339-001 · Issued Mar 28 · Scheduled Apr 15",
      amount: "$6,200.00",
      category: "Labor",
      crew: "Carlos Mendez (crew lead)",
      crewDate: "Apr 15, 7:00 AM",
    },
    {
      title: "Materials — ABC Supply",
      status: "Received",
      statusColor: "bg-green-50 border-green-200 text-green-600",
      detail: "PO-23339-002 · Issued Mar 20 · Delivered Apr 1",
      amount: "$5,840.00",
      category: "Materials",
    },
    {
      title: "Dump Trailer — Waste Mgmt",
      status: "Ordered",
      statusColor: "bg-amber-50 border-amber-200 text-amber-600",
      detail: "PO-23339-003 · Issued Apr 1 · Deliver Apr 14",
      amount: "$800.00",
      category: "Haul-off",
    },
  ];

  return (
    <div className="space-y-0">
      {pos.map((po, i) => (
        <div key={i} className="flex items-start justify-between py-2.5 border-b last:border-b-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{po.title}</span>
              <Badge variant="outline" className={`text-[10px] ${po.statusColor}`}>
                {po.status}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">{po.detail}</div>
            {po.crew && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-primary">
                <Users className="h-2.5 w-2.5" />
                {po.crew} · {po.crewDate}
              </div>
            )}
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className="text-sm font-mono">{po.amount}</div>
            <div className="text-xs text-muted-foreground">{po.category}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BillsTab() {
  const bills = [
    { title: "ABC Supply — Materials", status: "Paid", statusColor: "bg-green-50 border-green-200 text-green-600", detail: "BILL-23339-001 · From PO-23339-002 · Paid Apr 2", amount: "$5,520.00" },
    { title: "Peak Roofing Crew — Labor", status: "Pending", statusColor: "bg-amber-50 border-amber-200 text-amber-600", detail: "BILL-23339-002 · From PO-23339-001 · Due after completion", amount: "$6,200.00" },
  ];
  return (
    <div className="space-y-0">
      {bills.map((b, i) => (
        <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-b-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{b.title}</span>
              <Badge variant="outline" className={`text-[10px] ${b.statusColor}`}>{b.status}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">{b.detail}</div>
          </div>
          <div className="text-sm font-mono shrink-0 ml-4">{b.amount}</div>
        </div>
      ))}
    </div>
  );
}

function ExpensesTab() {
  const expenses = [
    { title: "Permit fee — City of CO Springs", card: "Visa ••4821", detail: "EXP-23339-001 · Mar 25 · Jackson Coffin", amount: "$275.00" },
    { title: "Extra flashing — Home Depot", card: "Visa ••4821", detail: "EXP-23339-002 · Apr 1 · Marcus Rivera", amount: "$87.50" },
    { title: "Fuel — job site round trip", card: "Amex ••1190", detail: "EXP-23339-003 · Mar 28 · Jackson Coffin", amount: "$62.40" },
  ];
  return (
    <div className="space-y-0">
      {expenses.map((e, i) => (
        <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-b-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{e.title}</span>
              <Badge variant="outline" className="text-[10px]">{e.card}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">{e.detail}</div>
          </div>
          <div className="text-sm font-mono shrink-0 ml-4">{e.amount}</div>
        </div>
      ))}
    </div>
  );
}

function VendorCreditsTab() {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">ABC Supply — Return 2 bundles shingles</span>
          <Badge variant="outline" className="text-[10px] bg-green-50 border-green-200 text-green-600">Applied</Badge>
        </div>
        <div className="text-xs text-muted-foreground">VC-23339-001 · Apr 3 · Applied to BILL-23339-001</div>
      </div>
      <div className="text-sm font-mono text-green-600 shrink-0 ml-4">($320.00)</div>
    </div>
  );
}

export function WorkOrdersCard() {
  return (
    <CollapsibleCard
      title="Work Orders"
      icon={ClipboardList}
      summary={
        <>3 POs · Committed <span className="font-mono">$12,840</span> · Paid <span className="font-mono text-destructive">$8,400</span></>
      }
      actions={
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm">+ PO</Button>
          <Button variant="outline" size="sm">+ Expense</Button>
        </div>
      }
    >
      <SummaryBar />
      <Tabs defaultValue="pos">
        <TabsList>
          <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="credits">Vendor Credits</TabsTrigger>
        </TabsList>
        <TabsContent value="pos"><POsTab /></TabsContent>
        <TabsContent value="bills"><BillsTab /></TabsContent>
        <TabsContent value="expenses"><ExpensesTab /></TabsContent>
        <TabsContent value="credits"><VendorCreditsTab /></TabsContent>
      </Tabs>
    </CollapsibleCard>
  );
}
