"use client";

import { CreditCard, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollapsibleCard } from "@/components/crm/CollapsibleCard";

function OwesCreditsSummary() {
  return (
    <div className="flex items-center rounded-md bg-muted/50 mb-3">
      <div className="flex-1 text-center py-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Owes</div>
        <div className="text-base font-medium font-mono text-orange-500">$1,500.00</div>
        <div className="text-[9px] uppercase tracking-wide text-muted-foreground mt-0.5">Invoices − Payments/Credits</div>
      </div>
      <div className="w-px h-7 bg-border" />
      <div className="flex-1 text-center py-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Credits</div>
        <div className="text-base font-medium font-mono text-green-600">$14,200.00</div>
        <div className="text-[9px] uppercase tracking-wide text-muted-foreground mt-0.5">Estimates + Credit Notes</div>
      </div>
    </div>
  );
}

function InvoiceRow({ title, status, statusColor, detail, amount, amountColor }: {
  title: string; status: string; statusColor: string; detail: string; amount: string; amountColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-b-0">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          <Badge variant="outline" className={`text-[10px] ${statusColor}`}>{status}</Badge>
        </div>
        <div className="text-xs text-muted-foreground">{detail}</div>
      </div>
      <div className={`text-sm font-mono shrink-0 ml-4 ${amountColor ?? ""}`}>{amount}</div>
    </div>
  );
}

export function BillingCard() {
  return (
    <CollapsibleCard
      title="Billing"
      icon={CreditCard}
      summary={
        <>Owes <span className="font-mono text-orange-500">$1,500</span> · Credits <span className="font-mono text-green-600">$14,200</span></>
      }
      actions={<Button variant="outline" size="sm">+ New invoice</Button>}
    >
      <OwesCreditsSummary />
      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="estimates">Estimates</TabsTrigger>
          <TabsTrigger value="credit-notes">Credit Notes</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices">
          <InvoiceRow title="Final Invoice — Deductible" status="Outstanding" statusColor="bg-amber-50 border-amber-200 text-amber-600" detail="INV-23339-002 · Issued Mar 25 · Due Apr 8" amount="$1,500.00" amountColor="text-orange-500" />
          <InvoiceRow title="Deposit Invoice" status="Paid" statusColor="bg-green-50 border-green-200 text-green-600" detail="INV-23339-001 · Issued Feb 22 · Paid Mar 2" amount="$14,200.00" />
          <div className="flex items-center justify-between py-2.5 opacity-50">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Supplement Balance</span>
                <Badge variant="outline" className="text-[10px]">Draft</Badge>
              </div>
              <div className="text-xs text-muted-foreground">Pending supplement approval</div>
            </div>
            <div className="text-sm font-mono shrink-0 ml-4">$2,380.00</div>
          </div>
        </TabsContent>
        <TabsContent value="estimates">
          <InvoiceRow title="Deposit Estimate" status="Accepted" statusColor="bg-green-50 border-green-200 text-green-600" detail="EST-23339-001 · Sent Feb 18 · Accepted Feb 20" amount="$14,200.00" />
          <InvoiceRow title="Full Scope Estimate" status="Accepted" statusColor="bg-green-50 border-green-200 text-green-600" detail="EST-23339-002 · Sent Feb 18 · Accepted Feb 20" amount="$18,080.00" />
        </TabsContent>
        <TabsContent value="credit-notes">
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No credit notes for this job.</p>
          </div>
        </TabsContent>
        <TabsContent value="payments">
          <div className="flex items-center justify-between py-2.5">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                <span className="text-sm font-semibold">Insurance Check — State Farm</span>
              </div>
              <div className="text-xs text-muted-foreground">Applied to INV-23339-001 · Mar 2</div>
            </div>
            <div className="text-right shrink-0 ml-4">
              <div className="text-sm font-mono text-green-600">$14,200.00</div>
              <div className="text-xs text-muted-foreground">Check</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </CollapsibleCard>
  );
}
