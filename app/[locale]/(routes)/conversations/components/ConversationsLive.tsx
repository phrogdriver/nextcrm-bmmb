"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Phone, PhoneOff, Plus, Search,
  PhoneIncoming, PhoneOutgoing, User, Briefcase,
  Mic, MicOff,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ResizableHandle, ResizablePanel, ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { useTwilio } from "@/context/twilio-context";
import {
  getConversations,
  type ConversationListItem,
} from "@/actions/crm/conversations/get-conversations";
import { getConversationById, type ConversationDetail as ConvDetail } from "@/actions/crm/conversations/get-conversation-by-id";
import type { ActivityWithLinks } from "@/actions/crm/activities/get-activities-by-entity";
import { getMessages, type MessageItem } from "@/actions/crm/conversations/get-messages";
import { createConversation } from "@/actions/crm/conversations/create-conversation";
import { updateConversation } from "@/actions/crm/conversations/update-conversation";
import { sendSms } from "@/actions/crm/conversations/send-sms";
import { placeCall } from "@/actions/crm/conversations/place-call";
import { searchCustomerByPhone, type CustomerMatch } from "@/actions/crm/conversations/search-customer-by-phone";
import { createContact } from "@/actions/crm/contacts/create-contact";
import { dispositionCall } from "@/actions/crm/conversations/disposition-call";
import { linkActivitiesToEntity } from "@/actions/crm/conversations/link-activities-to-entity";
import { bookLead, getProjectManagers } from "@/actions/crm/conversations/book-lead";
import { getLeadSources } from "@/actions/crm/conversations/get-lead-sources";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import type { ParsedAddress } from "@/components/ui/address-autocomplete";

// ── Types ────────────────────────────────────────────────

interface Props {
  initialConversations: ConversationListItem[];
}

// ── Thread List Item ─────────────────────────────────────

function getDisplayName(item: ConversationListItem): string {
  if (item.contact) {
    return [item.contact.first_name, item.contact.last_name].filter(Boolean).join(" ");
  }
  if (item.lead) {
    return [item.lead.firstName, item.lead.lastName].filter(Boolean).join(" ");
  }
  return item.phoneNumber || "Unknown";
}

function getInitials(name: string): string {
  if (name.startsWith("(") || name.startsWith("+")) return "?";
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function ThreadItem({
  item, selected, onClick,
}: {
  item: ConversationListItem; selected: boolean; onClick: () => void;
}) {
  const name = getDisplayName(item);
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b",
        selected && "bg-muted",
      )}
    >
      <Avatar className="h-10 w-10 mt-0.5 flex-shrink-0">
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate">{name}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(item.lastActivityAt), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm text-muted-foreground truncate">{item.phoneNumber}</span>
          <Badge variant={item.status === "open" ? "default" : "secondary"} className="text-[10px] h-4">
            {item.status}
          </Badge>
        </div>
      </div>
    </button>
  );
}

// ── Message Bubble ───────────────────────────────────────

function MessageBubble({ msg }: { msg: MessageItem }) {
  const isOutbound = msg.direction === "outbound";
  return (
    <div className={cn("flex gap-2 max-w-[80%] mb-3", isOutbound ? "ml-auto flex-row-reverse" : "mr-auto")}>
      <div>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isOutbound
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md",
          )}
        >
          {msg.body}
        </div>
        <div className={cn("text-xs text-muted-foreground mt-1", isOutbound && "text-right")}>
          {format(new Date(msg.createdAt), "MMM d, h:mm a")}
          {msg.twilioStatus && msg.twilioStatus !== "received" && (
            <span> &middot; {msg.twilioStatus}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Call Activity Pill ───────────────────────────────────

const DISPOSITION_LABELS: Record<string, string> = {
  booked: "Booked",
  not_interested: "Not Interested",
  wrong_number: "Wrong Number",
  spam: "Spam",
  existing_customer: "Existing Customer",
  no_response: "No Response",
};

function CallPill({ activity, onDispositioned }: { activity: ActivityWithLinks & { disposition?: string | null }; onDispositioned: () => void }) {
  const [showDisposition, setShowDisposition] = useState(false);
  const metadata = activity.metadata as { direction?: string; recordingUrl?: string } | null;
  const direction = metadata?.direction ?? "inbound";
  const DirIcon = direction === "inbound" ? PhoneIncoming : PhoneOutgoing;
  const mins = activity.duration ? Math.floor(activity.duration / 60) : 0;
  const secs = activity.duration ? activity.duration % 60 : 0;
  const durationStr = activity.duration ? `${mins}:${secs.toString().padStart(2, "0")}` : "";

  return (
    <div className="my-3">
      <div className="flex justify-center">
        <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full text-sm text-muted-foreground">
          <DirIcon className="h-3.5 w-3.5" />
          <span>{direction === "inbound" ? "Inbound" : "Outbound"} call</span>
          {activity.outcome && <span>&middot; {activity.outcome}</span>}
          {durationStr && <span>&middot; {durationStr}</span>}
          <span className="text-xs">{format(new Date(activity.date), "MMM d, h:mm a")}</span>
        </div>
      </div>
      {/* Disposition badge or button */}
      <div className="flex justify-center mt-1">
        {activity.disposition ? (
          <Badge variant="outline" className="text-xs">
            {DISPOSITION_LABELS[activity.disposition] ?? activity.disposition}
          </Badge>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setShowDisposition(true)}
          >
            Disposition
          </Button>
        )}
      </div>
      {showDisposition && (
        <DispositionPopover
          activityId={activity.id}
          onClose={() => setShowDisposition(false)}
          onDone={() => { setShowDisposition(false); onDispositioned(); }}
        />
      )}
    </div>
  );
}

// ── Disposition Popover ──────────────────────────────────

function DispositionPopover({
  activityId, onClose, onDone,
}: {
  activityId: string; onClose: () => void; onDone: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    const result = await dispositionCall({
      activityId,
      disposition: selected as any,
      note: note || undefined,
    });
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Call dispositioned as ${DISPOSITION_LABELS[selected]}`);
      onDone();
    }
  };

  return (
    <div className="flex justify-center mt-2">
      <div className="bg-background border rounded-lg shadow-lg p-3 w-72 space-y-2">
        <div className="flex flex-wrap gap-1">
          {Object.entries(DISPOSITION_LABELS).map(([key, label]) => (
            <Button
              key={key}
              variant={selected === key ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelected(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        {selected && (
          <>
            <Textarea
              placeholder="Notes (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="text-xs"
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-7 text-xs" disabled={submitting} onClick={handleSubmit}>
                {submitting ? "Saving…" : "Save"}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </>
        )}
        {!selected && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground w-full" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Timeline Item Type ───────────────────────────────────

type TimelineItem =
  | { type: "message"; data: MessageItem; timestamp: Date }
  | { type: "call"; data: ActivityWithLinks; timestamp: Date };

// ── Active Call Bar ──────────────────────────────────────

function ActiveCallBar() {
  const { callState, hangup, mute, isMuted } = useTwilio();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (callState.status !== "in-progress") { setElapsed(0); return; }
    const interval = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [callState.status]);

  if (callState.status !== "in-progress" && callState.status !== "ringing" && callState.status !== "connecting") {
    return null;
  }

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="flex-shrink-0 px-4 py-2 bg-green-600 text-white flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 animate-pulse" />
        <span className="text-sm font-medium">
          {callState.status === "in-progress"
            ? `${mins}:${secs.toString().padStart(2, "0")}`
            : callState.status === "connecting" ? "Connecting..." : "Ringing..."}
        </span>
        <span className="text-sm opacity-80">{callState.phoneNumber}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-green-700 h-7"
          onClick={() => mute(!isMuted)}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-red-600 h-7"
          onClick={hangup}
        >
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Customer Context Panel ───────────────────────────────

function CustomerPanel({
  conversation,
  onLinked,
}: {
  conversation: ConvDetail;
  onLinked: () => void;
}) {
  const [bookLeadOpen, setBookLeadOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const isLinked = !!conversation.contactId || !!conversation.leadId;

  const name = conversation.contact
    ? [conversation.contact.first_name, conversation.contact.last_name].filter(Boolean).join(" ")
    : conversation.lead
    ? [conversation.lead.firstName, conversation.lead.lastName].filter(Boolean).join(" ")
    : null;

  if (!isLinked) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center space-y-3 py-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Unknown Caller</p>
            <p className="text-sm text-muted-foreground">{conversation.phoneNumber}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={() => setBookLeadOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Book Lead
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setAddContactOpen(true)}>
            <User className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
        <BookLeadSheet
          open={bookLeadOpen}
          onOpenChange={setBookLeadOpen}
          phone={conversation.phoneNumber}
          conversationId={conversation.id}
          defaultLeadSourceId={conversation.trackingNumber?.leadSourceId ?? undefined}
          trackingSource={conversation.trackingNumber?.source}
          onCreated={onLinked}
        />
        <AddContactSheet
          open={addContactOpen}
          onOpenChange={setAddContactOpen}
          phone={conversation.phoneNumber}
          conversationId={conversation.id}
          onCreated={onLinked}
        />
      </div>
    );
  }

  const entityUrl = conversation.contactId
    ? `/crm/contacts/${conversation.contactId}`
    : conversation.leadId
    ? `/crm/leads/${conversation.leadId}`
    : null;

  return (
    <div className="p-4 space-y-4">
      <Link href={entityUrl ?? "#"} className="block">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Customer</CardTitle>
              <Badge variant="outline" className="text-xs">
                {conversation.contactId ? "Contact" : "Lead"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{name ?? "Unknown"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{conversation.phoneNumber}</span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Jobs */}
      {conversation.contact?.opportunities && conversation.contact.opportunities.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {conversation.contact.opportunities.map(({ opportunity: job }) => (
              <Link key={job.id} href={`/crm/opportunities/${job.id}`}>
                <div className="flex items-center gap-2 text-sm hover:bg-muted/50 rounded p-1.5 -mx-1.5 transition-colors">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium truncate">{job.name || job.job_number}</span>
                  {job.assigned_sales_stage?.name && (
                    <Badge variant="secondary" className="text-[10px] ml-auto flex-shrink-0">{job.assigned_sales_stage.name}</Badge>
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Book Lead Sheet ──────────────────────────────────────

function BookLeadSheet({
  open, onOpenChange, phone, conversationId, defaultLeadSourceId, trackingSource, onCreated,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  phone: string | null; conversationId: string;
  defaultLeadSourceId?: string; trackingSource?: string;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<"info" | "schedule">("info");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [request, setRequest] = useState("");
  const [email, setEmail] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyCity, setPropertyCity] = useState("");
  const [propertyState, setPropertyState] = useState("CO");
  const [propertyZip, setPropertyZip] = useState("");
  const [leadSourceId, setLeadSourceId] = useState(defaultLeadSourceId ?? "");

  // Lead sources + Schedule step
  const [leadSources, setLeadSources] = useState<Array<{ id: string; name: string }>>([]);
  const [allPms, setAllPms] = useState<Array<{ id: string; name: string | null; skills: string[] }>>([]);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("10:00");
  const [schedNotes, setSchedNotes] = useState("");
  const [schedTz, setSchedTz] = useState("America/Denver");
  const [submitting, setSubmitting] = useState(false);

  // Load lead sources on mount
  useEffect(() => {
    if (open && leadSources.length === 0) {
      getLeadSources().then(setLeadSources);
    }
  }, [open, leadSources.length]);

  const [propertyLat, setPropertyLat] = useState<number | null>(null);
  const [propertyLng, setPropertyLng] = useState<number | null>(null);

  const handleAddressSelect = (parsed: ParsedAddress) => {
    setPropertyAddress(parsed.address);
    setPropertyCity(parsed.city);
    setPropertyState(parsed.state);
    setPropertyZip(parsed.zip);
    setPropertyLat(parsed.lat);
    setPropertyLng(parsed.lng);
  };

  // Filtered PMs based on required skills
  const filteredPms = requiredSkills.length > 0
    ? allPms.filter((pm) => requiredSkills.every((s) => pm.skills.includes(s)))
    : allPms;

  const handleNextStep = async () => {
    if (!lastName.trim()) { toast.error("Last name is required"); return; }
    if (!email.trim()) { toast.error("Email is required"); return; }
    // Fetch all PMs (filter client-side by skills)
    const pmList = await getProjectManagers();
    setAllPms(pmList);
    setStep("schedule");
  };

  const toggleSkill = (skill: string) => {
    setRequiredSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
    setAssignedTo(""); // reset PM selection when skills change
  };

  const handleBook = async (withSchedule: boolean) => {
    if (!lastName.trim()) { toast.error("Last name is required"); return; }
    if (!email.trim()) { toast.error("Email is required"); return; }
    if (withSchedule && (!assignedTo || !schedDate)) {
      toast.error("Select a PM and date"); return;
    }
    setSubmitting(true);
    const result = await bookLead({
      firstName: firstName || undefined,
      lastName,
      phone: phone || undefined,
      request: request || undefined,
      propertyAddress: propertyAddress || undefined,
      propertyCity: propertyCity || undefined,
      propertyState: propertyState || undefined,
      propertyZip: propertyZip || undefined,
      propertyLat: propertyLat ?? undefined,
      propertyLng: propertyLng ?? undefined,
      email: email || undefined,
      leadSourceId: leadSourceId || undefined,
      conversationId,
      schedule: withSchedule ? {
        assignedTo,
        startDate: schedDate,
        startTime: schedTime,
        timezone: schedTz,
        notes: schedNotes || undefined,
      } : undefined,
    });
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(withSchedule ? "Lead booked with inspection scheduled" : "Lead created");
    // Reset
    setStep("info"); setFirstName(""); setLastName(""); setEmail(""); setRequest("");
    setPropertyAddress(""); setPropertyCity(""); setPropertyState("CO"); setPropertyZip("");
    setLeadSourceId(""); setPropertyLat(null); setPropertyLng(null); setRequiredSkills([]);
    setAssignedTo(""); setSchedDate(""); setSchedTime("10:00"); setSchedNotes(""); setSchedTz("America/Denver");
    onOpenChange(false);
    onCreated();
  };

  const handleClose = (v: boolean) => {
    if (!v) { setStep("info"); }
    onOpenChange(v);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        {step === "info" ? (
          <>
            <SheetHeader>
              <SheetTitle>Book Lead</SheetTitle>
              <SheetDescription>Create a lead, contact, and schedule inspection</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input defaultValue={phone ?? ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" />
              </div>
              <div className="space-y-2">
                <Label>Property address</Label>
                <AddressAutocomplete
                  value={propertyAddress}
                  onChange={setPropertyAddress}
                  onSelect={handleAddressSelect}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={propertyCity} onChange={(e) => setPropertyCity(e.target.value)} placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={propertyState} onChange={(e) => setPropertyState(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Zip</Label>
                  <Input value={propertyZip} onChange={(e) => setPropertyZip(e.target.value)} placeholder="80903" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>What do they need?</Label>
                <Textarea
                  placeholder="Roof leak, storm damage, gutters, etc."
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Lead source</Label>
                <Select value={leadSourceId} onValueChange={setLeadSourceId}>
                  <SelectTrigger><SelectValue placeholder="Select source…" /></SelectTrigger>
                  <SelectContent>
                    {leadSources.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {trackingSource && defaultLeadSourceId && (
                  <p className="text-xs text-muted-foreground">
                    Auto-detected from tracking number: {trackingSource}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Skills needed</Label>
                <div className="flex flex-wrap gap-2">
                  {["Asphalt", "Tile", "Metal", "TPO/Flat", "Windows", "Siding", "Paint"].map((skill) => (
                    <Button
                      key={skill}
                      type="button"
                      size="sm"
                      variant={requiredSkills.includes(skill.toLowerCase()) ? "default" : "outline"}
                      className="h-7 text-xs"
                      onClick={() => toggleSkill(skill.toLowerCase())}
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleNextStep}>
                  Next: Schedule Inspection
                </Button>
                <Button variant="outline" onClick={() => handleBook(false)} disabled={submitting}>
                  {submitting ? "Saving…" : "Save Without Scheduling"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>Schedule Inspection</SheetTitle>
              <SheetDescription>Assign a PM and pick a date/time</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              {propertyAddress && (
                <Card>
                  <CardContent className="pt-4 text-sm">
                    <p className="font-medium">{propertyAddress}</p>
                    <p className="text-muted-foreground">{[propertyCity, propertyState, propertyZip].filter(Boolean).join(", ")}</p>
                  </CardContent>
                </Card>
              )}
              <div className="space-y-2">
                <Label>Project Manager</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Select PM…" /></SelectTrigger>
                  <SelectContent>
                    {filteredPms.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        {pm.name || "Unnamed"}
                        {pm.skills.length > 0 && (
                          <span className="text-muted-foreground ml-1">({pm.skills.join(", ")})</span>
                        )}
                      </SelectItem>
                    ))}
                    {filteredPms.length === 0 && (
                      <div className="p-2 text-xs text-muted-foreground text-center">
                        No PMs match the selected skills
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={schedTz} onValueChange={setSchedTz}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Denver">Mountain (CO)</SelectItem>
                    <SelectItem value="America/Chicago">Central (TX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any special instructions for the PM"
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("info")}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => handleBook(true)} disabled={submitting}>
                  {submitting ? "Booking…" : "Book Inspection"}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Add Contact Sheet ────────────────────────────────────

function AddContactSheet({
  open, onOpenChange, phone, conversationId, onCreated,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  phone: string | null; conversationId: string; onCreated: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactType, setContactType] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!lastName.trim()) { toast.error("Last name is required"); return; }
    setSubmitting(true);
    const result = await createContact({
      first_name: firstName || undefined,
      last_name: lastName,
      mobile_phone: phone || undefined,
      email: email || undefined,
      description: notes || undefined,
    });
    if (result.error) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }
    if (result.data) {
      await updateConversation({ id: conversationId, contactId: result.data.id });
      await linkActivitiesToEntity({ conversationId, entityType: "contact", entityId: result.data.id });
      toast.success("Contact created and linked");
      setFirstName(""); setLastName(""); setEmail(""); setContactType(""); setNotes("");
      setSubmitting(false);
      onOpenChange(false);
      onCreated();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Contact</SheetTitle>
          <SheetDescription>Add as an existing customer or vendor contact</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input defaultValue={phone ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" />
          </div>
          <div className="space-y-2">
            <Label>Contact type</Label>
            <Select value={contactType} onValueChange={setContactType}>
              <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="homeowner">Homeowner</SelectItem>
                <SelectItem value="property_manager">Property Manager</SelectItem>
                <SelectItem value="adjuster">Insurance Adjuster</SelectItem>
                <SelectItem value="vendor">Vendor / Supplier</SelectItem>
                <SelectItem value="referral_partner">Referral Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How do you know this person?"
              rows={3}
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Adding…" : "Add Contact"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── New Conversation Sheet ───────────────────────────────

function NewConversationSheet({
  open, onOpenChange, onCreated,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [matches, setMatches] = useState<CustomerMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<CustomerMatch | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePhoneBlur = async () => {
    if (phoneNumber.length >= 3) {
      const { data } = await searchCustomerByPhone(phoneNumber);
      setMatches(data);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = await createConversation({
      phoneNumber: phoneNumber || undefined,
      contactId: selectedMatch?.type === "contact" ? selectedMatch.id : undefined,
      leadId: selectedMatch?.type === "lead" ? selectedMatch.id : undefined,
    });
    setSubmitting(false);
    if (result.error) { toast.error(result.error); return; }
    if (result.data) {
      toast.success("Conversation created");
      setPhoneNumber(""); setMatches([]); setSelectedMatch(null);
      onOpenChange(false);
      onCreated(result.data.id);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Conversation</SheetTitle>
          <SheetDescription>Start a new conversation with a phone number</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Phone number</Label>
            <Input
              placeholder="+17195551234"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onBlur={handlePhoneBlur}
            />
          </div>
          {matches.length > 0 && (
            <div className="space-y-2">
              <Label>Matching customers</Label>
              <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {matches.map((m) => (
                  <button
                    key={`${m.type}-${m.id}`}
                    onClick={() => setSelectedMatch(m)}
                    className={cn(
                      "w-full p-2 text-left text-sm hover:bg-accent",
                      selectedMatch?.id === m.id && "bg-accent",
                    )}
                  >
                    <div className="font-medium">{[m.firstName, m.lastName].filter(Boolean).join(" ")}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.type === "contact" ? "Contact" : "Lead"} &middot; {m.phone}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Creating…" : "Create Conversation"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main Component ───────────────────────────────────────

export function ConversationsLive({ initialConversations }: Props) {
  const { dial, onNewMessage, subscribeToConversation, isMessagingReady } = useTwilio();

  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(initialConversations[0]?.id ?? null);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("open");
  const [search, setSearch] = useState("");
  const [newSheetOpen, setNewSheetOpen] = useState(false);

  // Detail state
  const [detail, setDetail] = useState<ConvDetail | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activities, setActivities] = useState<ActivityWithLinks[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Compose
  const [composeText, setComposeText] = useState("");
  const [sending, setSending] = useState(false);

  const filteredConversations = conversations.filter(
    (c) => filter === "all" || c.status === filter
  );

  // Refresh conversation list
  const refreshList = useCallback(async () => {
    const { data } = await getConversations(undefined, search || undefined);
    setConversations(data);
  }, [search]);

  // Load conversation detail
  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    const [convResult, msgResult] = await Promise.all([
      getConversationById(id),
      getMessages(id),
    ]);
    setDetail(convResult.conversation);
    setMessages(msgResult.data);
    setActivities(convResult.activities);
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  // Subscribe to real-time updates when a conversation with a Twilio SID is selected
  useEffect(() => {
    if (detail?.twilioConversationSid && isMessagingReady) {
      subscribeToConversation(detail.twilioConversationSid);
    }
  }, [detail?.twilioConversationSid, isMessagingReady, subscribeToConversation]);

  // Real-time: listen for new messages from Twilio Conversations SDK
  useEffect(() => {
    const unsubscribe = onNewMessage((event) => {
      // If the message is for the currently selected conversation, add it to the list
      if (detail?.twilioConversationSid === event.conversationSid) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.twilioMessageSid === event.message.sid)) return prev;
          return [
            ...prev,
            {
              id: event.message.sid,
              conversationId: detail.id,
              direction: event.message.author.startsWith("+") ? "inbound" : "outbound",
              body: event.message.body,
              mediaUrls: [],
              twilioStatus: null,
              twilioMessageSid: event.message.sid,
              sentBy: null,
              sent_by_user: null,
              createdAt: event.message.dateCreated,
            } as MessageItem,
          ];
        });
      }
      // Refresh the conversation list to update timestamps
      refreshList();
    });
    return unsubscribe;
  }, [onNewMessage, detail, refreshList]);

  // Polling fallback: check for new messages every 5 seconds
  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(async () => {
      const { data: latest } = await getMessages(selectedId);
      setMessages((prev) => {
        if (latest.length !== prev.length) return latest;
        return prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedId]);

  // Poll conversation list every 10 seconds for new conversations
  useEffect(() => {
    const interval = setInterval(refreshList, 10000);
    return () => clearInterval(interval);
  }, [refreshList]);

  // Search
  const handleSearch = useCallback(async () => {
    const { data } = await getConversations(undefined, search || undefined);
    setConversations(data);
  }, [search]);

  // Send SMS
  const handleSend = async () => {
    if (!composeText.trim() || !selectedId) return;
    setSending(true);
    const result = await sendSms({ conversationId: selectedId, body: composeText });
    setSending(false);
    if (result.error) { toast.error(result.error); return; }
    setComposeText("");
    loadDetail(selectedId);
    refreshList();
  };

  // Place outbound call
  const handleDial = async () => {
    if (!detail?.phoneNumber) return;
    const result = await placeCall({
      phoneNumber: detail.phoneNumber,
      conversationId: selectedId ?? undefined,
    });
    if (result.error) { toast.error(result.error); return; }
    dial(detail.phoneNumber);
  };

  // Close/reopen conversation
  const handleToggleStatus = async () => {
    if (!selectedId || !detail) return;
    const newStatus = detail.status === "open" ? "closed" : "open";
    const result = await updateConversation({ id: selectedId, status: newStatus as any });
    if (result.error) { toast.error(result.error); return; }
    loadDetail(selectedId);
    refreshList();
  };

  const handleNewCreated = (id: string) => {
    refreshList();
    setSelectedId(id);
  };

  const handleLinked = () => {
    if (selectedId) loadDetail(selectedId);
    refreshList();
  };

  // Detail display name
  const detailName = detail
    ? (detail.contact
      ? [detail.contact.first_name, detail.contact.last_name].filter(Boolean).join(" ")
      : detail.lead
      ? [detail.lead.firstName, detail.lead.lastName].filter(Boolean).join(" ")
      : detail.phoneNumber || "Unknown")
    : "";

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full flex-row border-t">
      {/* Thread list */}
      <ResizablePanel defaultSize="35%" minSize="20%" maxSize="45%">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-shrink-0 p-4 space-y-3 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Conversations</h2>
              <Button size="sm" onClick={() => setNewSheetOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search…"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onBlur={handleSearch}
              />
            </div>
            <div className="flex gap-1">
              {(["open", "closed", "all"] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? "default" : "outline"}
                  onClick={() => setFilter(f)}
                  className="flex-1 capitalize text-xs h-8"
                >
                  {f}
                  {f === "open" && conversations.filter((c) => c.status === "open").length > 0 && (
                    <span className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] px-1">
                      {conversations.filter((c) => c.status === "open").length}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
          <ScrollArea className="flex-1">
            {filteredConversations.map((item) => (
              <ThreadItem
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                onClick={() => setSelectedId(item.id)}
              />
            ))}
            {filteredConversations.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No {filter} conversations
              </div>
            )}
          </ScrollArea>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Message timeline */}
      <ResizablePanel defaultSize="40%" minSize="30%">
        <div className="flex flex-col h-full overflow-hidden">
          {detail ? (
            <>
              {/* Header */}
              <div className="flex-shrink-0 p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{getInitials(detailName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{detailName}</h3>
                      <p className="text-sm text-muted-foreground">{detail.phoneNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={detail.status === "open" ? "default" : "secondary"}>
                      {detail.status}
                    </Badge>
                    <Button size="sm" variant="outline" title="Call" onClick={handleDial}>
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleToggleStatus}>
                      {detail.status === "open" ? "Close" : "Reopen"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active call bar */}
              <ActiveCallBar />

              {/* Timeline: messages + call activities merged by timestamp */}
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {(() => {
                    const timeline: TimelineItem[] = [
                      ...messages.map((m) => ({
                        type: "message" as const,
                        data: m,
                        timestamp: new Date(m.createdAt),
                      })),
                      ...activities
                        .filter((a) => a.type === "call")
                        .map((a) => ({
                          type: "call" as const,
                          data: a,
                          timestamp: new Date(a.date),
                        })),
                    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

                    if (timeline.length === 0) {
                      return (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No activity yet. Send an SMS or make a call to start.
                        </p>
                      );
                    }

                    return timeline.map((item) =>
                      item.type === "message" ? (
                        <MessageBubble key={`msg-${item.data.id}`} msg={item.data} />
                      ) : (
                        <CallPill key={`call-${item.data.id}`} activity={item.data} onDispositioned={() => { if (selectedId) loadDetail(selectedId); refreshList(); }} />
                      )
                    );
                  })()}
                </div>
              </ScrollArea>

              {/* Compose */}
              <div className="flex-shrink-0 p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message…"
                    className="flex-1"
                    value={composeText}
                    onChange={(e) => setComposeText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    disabled={sending}
                  />
                  <Button onClick={handleSend} disabled={sending || !composeText.trim()}>
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {detailLoading ? "Loading…" : "Select a conversation"}
            </div>
          )}
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Customer panel */}
      <ResizablePanel defaultSize="25%" minSize="20%" maxSize="35%">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-shrink-0 p-4 border-b">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customer</h3>
          </div>
          <ScrollArea className="flex-1">
            {detail ? (
              <CustomerPanel conversation={detail} onLinked={handleLinked} />
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Select a conversation
              </div>
            )}
          </ScrollArea>
        </div>
      </ResizablePanel>

      <NewConversationSheet open={newSheetOpen} onOpenChange={setNewSheetOpen} onCreated={handleNewCreated} />
    </ResizablePanelGroup>
  );
}
