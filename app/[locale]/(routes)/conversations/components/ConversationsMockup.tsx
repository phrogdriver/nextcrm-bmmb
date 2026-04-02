"use client";

import { useState, useEffect } from "react";
import {
  Phone, PhoneOff, MessageSquare, MessageCircle, Plus, Search,
  PhoneIncoming, PhoneOutgoing, User, Briefcase, MapPin,
  Clock, CalendarDays, ArrowUpRight, Megaphone,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

// ── Mock Data ────────────────────────────────────────────

type MockMessage = {
  id: string;
  type: "call" | "sms" | "chat";
  direction: "inbound" | "outbound";
  content: string;
  timestamp: string;
  duration?: string;
  outcome?: string;
};

type MockThread = {
  id: string;
  name: string;
  phone: string;
  trackingNumber?: string; // the number they dialed
  source?: string;         // marketing source from tracking number
  lastMessage: string;
  lastTime: string;
  unread: number;
  status: "open" | "closed";
  customer: {
    type: "contact" | "lead" | null;
    name: string;
    phone: string;
    email?: string;
    address?: string;
  } | null;
  job: {
    id: string;
    name: string;
    stage: string;
    payor: string;
  } | null;
  messages: MockMessage[];
};

const MOCK_THREADS: MockThread[] = [
  {
    id: "1",
    name: "Maria Rodriguez",
    phone: "(719) 555-0142",
    trackingNumber: "(719) 555-8000",
    source: "Google Ads — Roof Repair",
    lastMessage: "Yes, Thursday at 2pm works for the inspection",
    lastTime: "5 min ago",
    unread: 2,
    status: "open",
    customer: {
      type: "contact",
      name: "Maria Rodriguez",
      phone: "(719) 555-0142",
      email: "maria.rodriguez@email.com",
      address: "1847 Oak Valley Dr, Colorado Springs, CO 80919",
    },
    job: {
      id: "J-2024-0147",
      name: "Rodriguez – Roof Replacement",
      stage: "Appointment Confirmed",
      payor: "Insurance",
    },
    messages: [
      { id: "m1", type: "call", direction: "inbound", content: "Inbound call — answered", timestamp: "Today, 9:15 AM", duration: "4 min", outcome: "Answered" },
      { id: "m2", type: "sms", direction: "inbound", content: "Hi, I noticed some shingles missing after the storm last night. Can someone come take a look?", timestamp: "Today, 9:22 AM" },
      { id: "m3", type: "sms", direction: "outbound", content: "Hi Maria! Sorry to hear that. We can have a project manager out this week. Does Thursday at 2pm work?", timestamp: "Today, 9:25 AM" },
      { id: "m4", type: "sms", direction: "inbound", content: "Yes, Thursday at 2pm works for the inspection", timestamp: "Today, 9:28 AM" },
      { id: "m5", type: "chat", direction: "outbound", content: "Great, I've scheduled the inspection. You'll receive a confirmation email shortly.", timestamp: "Today, 9:30 AM" },
    ],
  },
  {
    id: "2",
    name: "James & Linda Whitfield",
    phone: "(719) 555-0298",
    trackingNumber: "(719) 555-8001",
    source: "Nextdoor Ad — Hail Season",
    lastMessage: "Thanks for getting back to us so quickly!",
    lastTime: "1 hour ago",
    unread: 0,
    status: "open",
    customer: {
      type: "lead",
      name: "James Whitfield",
      phone: "(719) 555-0298",
      address: "2203 Pinecrest Blvd, Manitou Springs, CO 80829",
    },
    job: {
      id: "J-2024-0152",
      name: "Whitfield – Hail Damage Inspection",
      stage: "Job Details Confirmed",
      payor: "Insurance",
    },
    messages: [
      { id: "m6", type: "chat", direction: "inbound", content: "We just had a hail storm and our neighbors are all getting their roofs checked. Can you come out?", timestamp: "Today, 8:00 AM" },
      { id: "m7", type: "chat", direction: "outbound", content: "Absolutely! We're scheduling inspections in your area this week. What's a good time?", timestamp: "Today, 8:05 AM" },
      { id: "m8", type: "sms", direction: "outbound", content: "Hi James, following up from our chat. I have Tuesday morning or Wednesday afternoon available for the inspection.", timestamp: "Today, 8:15 AM" },
      { id: "m9", type: "call", direction: "outbound", content: "Outbound call — answered", timestamp: "Today, 8:30 AM", duration: "6 min", outcome: "Answered" },
      { id: "m10", type: "sms", direction: "inbound", content: "Thanks for getting back to us so quickly!", timestamp: "Today, 8:45 AM" },
    ],
  },
  {
    id: "3",
    name: "(719) 555-0371",
    phone: "(719) 555-0371",
    trackingNumber: "(719) 555-8002",
    source: "Yard Sign — Briargate",
    lastMessage: "Missed call",
    lastTime: "3 hours ago",
    unread: 1,
    status: "open",
    customer: null,
    job: null,
    messages: [
      { id: "m11", type: "call", direction: "inbound", content: "Inbound call — missed", timestamp: "Today, 6:45 AM", duration: "0 min", outcome: "No Answer" },
      { id: "m12", type: "sms", direction: "inbound", content: "Hey I saw your truck in my neighborhood. Do you do gutters too?", timestamp: "Today, 7:00 AM" },
    ],
  },
  {
    id: "4",
    name: "Tom & Sarah Chen",
    phone: "(719) 555-0489",
    trackingNumber: "(719) 555-8000",
    source: "Google Ads — Roof Repair",
    lastMessage: "Perfect, we'll be home. See you then!",
    lastTime: "2 min ago",
    unread: 1,
    status: "open",
    customer: {
      type: "contact",
      name: "Tom Chen",
      phone: "(719) 555-0489",
      email: "tom.chen@email.com",
      address: "4821 Stetson Hills Blvd, Colorado Springs, CO 80922",
    },
    job: {
      id: "J-2024-0138",
      name: "Chen – Hail Damage Full Replacement",
      stage: "Claim Approved",
      payor: "Insurance",
    },
    messages: [
      // Day 1 — Initial contact
      { id: "m20", type: "call", direction: "inbound", content: "Inbound call — answered", timestamp: "Mar 18, 9:02 AM", duration: "7 min", outcome: "Answered" },
      { id: "m21", type: "sms", direction: "outbound", content: "Hi Tom, thanks for calling Integrity Roofing! As discussed, I'll have Project Manager Mike out Thursday for the inspection. You're at 4821 Stetson Hills Blvd, correct?", timestamp: "Mar 18, 9:15 AM" },
      { id: "m22", type: "sms", direction: "inbound", content: "Yes that's correct. What time Thursday?", timestamp: "Mar 18, 9:18 AM" },
      { id: "m23", type: "sms", direction: "outbound", content: "How does 10am work?", timestamp: "Mar 18, 9:20 AM" },
      { id: "m24", type: "sms", direction: "inbound", content: "10am is great. Should we be home?", timestamp: "Mar 18, 9:22 AM" },
      { id: "m25", type: "sms", direction: "outbound", content: "It helps if someone is home so Mike can show you any damage he finds and go over next steps. He'll be there about 45 minutes.", timestamp: "Mar 18, 9:25 AM" },
      { id: "m26", type: "sms", direction: "inbound", content: "Ok we'll be here. Thanks!", timestamp: "Mar 18, 9:26 AM" },

      // Day 2 — Inspection day
      { id: "m27", type: "sms", direction: "outbound", content: "Good morning Tom! Just confirming Mike will be at your property today at 10am for the roof inspection.", timestamp: "Mar 20, 8:30 AM" },
      { id: "m28", type: "sms", direction: "inbound", content: "👍 We're ready", timestamp: "Mar 20, 8:45 AM" },
      { id: "m29", type: "call", direction: "outbound", content: "Outbound call — answered", timestamp: "Mar 20, 11:15 AM", duration: "12 min", outcome: "Answered" },
      { id: "m30", type: "sms", direction: "outbound", content: "Tom, following up from Mike's visit. He found significant hail damage on the north and west slopes — impact marks on shingles, damaged ridge cap, and two cracked pipe boots. He recommends filing an insurance claim. I'll email you the inspection report with photos.", timestamp: "Mar 20, 11:30 AM" },
      { id: "m31", type: "sms", direction: "inbound", content: "Wow didn't realize it was that bad. Yes please send the report. Our insurance is State Farm, should we call them or do you handle that?", timestamp: "Mar 20, 11:35 AM" },
      { id: "m32", type: "sms", direction: "outbound", content: "You'll need to call State Farm to open the claim. Your policy number should be on your declarations page. Tell them you had a roofing contractor inspect and found hail damage. Once you have a claim number, text it to me and we'll take it from there.", timestamp: "Mar 20, 11:40 AM" },
      { id: "m33", type: "sms", direction: "inbound", content: "Ok will do. Sarah is calling them now.", timestamp: "Mar 20, 11:42 AM" },

      // Day 3 — Claim filed
      { id: "m34", type: "sms", direction: "inbound", content: "Claim filed! Number is 44-K829-471. They said an adjuster will call us within 3 business days.", timestamp: "Mar 21, 2:15 PM" },
      { id: "m35", type: "sms", direction: "outbound", content: "Great, got it! I've added the claim info to your file. When the adjuster calls to schedule, try to get a date when Mike can also be there — it really helps to have our guy on the roof with the adjuster.", timestamp: "Mar 21, 2:20 PM" },
      { id: "m36", type: "sms", direction: "inbound", content: "Will do. Is that normal to have your guy there?", timestamp: "Mar 21, 2:22 PM" },
      { id: "m37", type: "sms", direction: "outbound", content: "Absolutely, it's very common and adjusters expect it. Mike knows exactly where the damage is and can make sure nothing gets missed. It protects you.", timestamp: "Mar 21, 2:25 PM" },
      { id: "m38", type: "sms", direction: "inbound", content: "That makes sense. Thanks for looking out for us.", timestamp: "Mar 21, 2:27 PM" },

      // Day 5 — Adjuster scheduling
      { id: "m39", type: "sms", direction: "inbound", content: "Adjuster called — they want to come out next Tuesday at 1pm. Does that work for Mike?", timestamp: "Mar 23, 10:00 AM" },
      { id: "m40", type: "call", direction: "outbound", content: "Outbound call — answered", timestamp: "Mar 23, 10:05 AM", duration: "3 min", outcome: "Answered" },
      { id: "m41", type: "sms", direction: "outbound", content: "Tuesday at 1pm works! Mike will be there. The adjuster's name is?", timestamp: "Mar 23, 10:10 AM" },
      { id: "m42", type: "sms", direction: "inbound", content: "Dave Martinez from State Farm", timestamp: "Mar 23, 10:12 AM" },
      { id: "m43", type: "sms", direction: "outbound", content: "Got it. I've added Dave to the file. Mike will meet him there Tuesday. You don't need to be on the roof but it's good to be home.", timestamp: "Mar 23, 10:15 AM" },

      // Day 8 — Adjuster visit
      { id: "m44", type: "sms", direction: "outbound", content: "Hi Tom, just checking in — adjuster visit is today at 1pm. Mike is confirmed and heading your way.", timestamp: "Mar 26, 12:30 PM" },
      { id: "m45", type: "sms", direction: "inbound", content: "Thanks for the reminder! We're home.", timestamp: "Mar 26, 12:35 PM" },
      { id: "m46", type: "call", direction: "outbound", content: "Outbound call — answered", timestamp: "Mar 26, 2:45 PM", duration: "8 min", outcome: "Answered" },
      { id: "m47", type: "sms", direction: "outbound", content: "Good news — adjuster agreed with our assessment. Full replacement approved. He's writing up the scope now, you should receive the estimate from State Farm in a few days. ACV check will follow.", timestamp: "Mar 26, 3:00 PM" },
      { id: "m48", type: "sms", direction: "inbound", content: "That's amazing news!! How long until the actual work happens?", timestamp: "Mar 26, 3:05 PM" },
      { id: "m49", type: "sms", direction: "outbound", content: "Once we receive the insurance paperwork and your ACV check, we can usually get you on the schedule within 1-2 weeks depending on weather. We'll go over everything before we start.", timestamp: "Mar 26, 3:10 PM" },
      { id: "m50", type: "sms", direction: "inbound", content: "Sounds good. Sarah and I really appreciate how smooth this has been.", timestamp: "Mar 26, 3:12 PM" },

      // Day 12 — Paperwork and scheduling
      { id: "m51", type: "sms", direction: "inbound", content: "Got the check from State Farm! $14,200. And the scope of loss document. Want me to take a picture and send it?", timestamp: "Mar 30, 9:00 AM" },
      { id: "m52", type: "sms", direction: "outbound", content: "Yes please send photos of the check and the scope document. We'll review everything and get you on the schedule.", timestamp: "Mar 30, 9:05 AM" },
      { id: "m53", type: "sms", direction: "inbound", content: "[Photo of check] [Photo of scope document]", timestamp: "Mar 30, 9:15 AM" },
      { id: "m54", type: "sms", direction: "outbound", content: "Got them, thank you! Everything looks correct. We need to schedule a time to go over the contract and color selection. Are you available this Wednesday evening?", timestamp: "Mar 30, 9:30 AM" },
      { id: "m55", type: "sms", direction: "inbound", content: "Wednesday after 5pm works. Can you come to the house?", timestamp: "Mar 30, 9:35 AM" },
      { id: "m56", type: "sms", direction: "outbound", content: "Perfect, Mike will be there Wednesday at 5:30pm with samples and the contract. He'll walk you through the whole process.", timestamp: "Mar 30, 9:40 AM" },

      // Day 15 — Production scheduling
      { id: "m57", type: "call", direction: "outbound", content: "Outbound call — answered", timestamp: "Apr 1, 10:00 AM", duration: "5 min", outcome: "Answered" },
      { id: "m58", type: "sms", direction: "outbound", content: "Tom, great news — you're on the schedule! Crew will be there next Tuesday April 8th, starting at 7am. Full replacement should take 1-2 days depending on weather. A few things to prep: move cars out of the driveway, take down any hanging items on interior walls, and the crew will need access to an exterior outlet.", timestamp: "Apr 1, 10:15 AM" },
      { id: "m59", type: "sms", direction: "inbound", content: "Awesome! We'll have everything ready. Will someone let us know when they're on the way?", timestamp: "Apr 1, 10:20 AM" },
      { id: "m60", type: "sms", direction: "outbound", content: "Yes, the crew lead will text you when they're 30 minutes out. And Mike will stop by during the job to check on things. Any questions before then?", timestamp: "Apr 1, 10:25 AM" },
      { id: "m61", type: "sms", direction: "inbound", content: "Perfect, we'll be home. See you then!", timestamp: "Apr 1, 10:28 AM" },
    ],
  },
];

// ── Components ───────────────────────────────────────────

const MESSAGE_ICONS = {
  call: Phone,
  sms: MessageSquare,
  chat: MessageCircle,
};

function ThreadItem({
  thread,
  selected,
  onClick,
}: {
  thread: MockThread;
  selected: boolean;
  onClick: () => void;
}) {
  const hasUnread = thread.unread > 0;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-4 text-left hover:bg-accent transition-colors border-b",
        selected && "bg-accent",
      )}
    >
      <Avatar className="h-10 w-10 mt-0.5 flex-shrink-0">
        <AvatarFallback className={cn(hasUnread && "bg-primary text-primary-foreground")}>
          {thread.name[0] === "(" ? "?" : thread.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("truncate", hasUnread ? "font-semibold" : "font-medium")}>
            {thread.name}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {thread.lastTime}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm text-muted-foreground truncate">{thread.phone}</span>
          {thread.source && (
            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
              &middot; {thread.source}
            </span>
          )}
        </div>
        <div className={cn("text-sm truncate mt-1", hasUnread ? "text-foreground font-medium" : "text-muted-foreground")}>
          {thread.lastMessage}
        </div>
      </div>
      {hasUnread && (
        <div className="flex-shrink-0 mt-1">
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs px-1.5">
            {thread.unread}
          </span>
        </div>
      )}
    </button>
  );
}

function MessageBubble({ msg }: { msg: MockMessage }) {
  const isOutbound = msg.direction === "outbound";
  const Icon = MESSAGE_ICONS[msg.type];

  if (msg.type === "call") {
    const DirIcon = msg.direction === "inbound" ? PhoneIncoming : PhoneOutgoing;
    return (
      <div className="flex justify-center my-3">
        <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full text-sm text-muted-foreground">
          <DirIcon className="h-3.5 w-3.5" />
          <span>{msg.content}</span>
          {msg.duration && <span>&middot; {msg.duration}</span>}
          <span className="text-xs">{msg.timestamp}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2 max-w-[80%] mb-3", isOutbound ? "ml-auto flex-row-reverse" : "mr-auto")}>
      <div className="flex-shrink-0 mt-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isOutbound
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md",
          )}
        >
          {msg.content}
        </div>
        <div className={cn("text-xs text-muted-foreground mt-1", isOutbound && "text-right")}>
          {msg.type.toUpperCase()} &middot; {msg.timestamp}
        </div>
      </div>
    </div>
  );
}

type MockSlot = {
  id: string;
  pm: string;
  pmInitials: string;
  date: string;
  time: string;
  distance: string;
  reason: string;
  recommended?: boolean;
};

const MOCK_SLOTS: MockSlot[] = [
  { id: "s1", pm: "Mike Torres", pmInitials: "MT", date: "Tue, Apr 8", time: "10:00 AM", distance: "4.2 mi", reason: "Next in rotation · closest", recommended: true },
  { id: "s2", pm: "Mike Torres", pmInitials: "MT", date: "Wed, Apr 9", time: "2:00 PM", distance: "4.2 mi", reason: "Same PM · next day" },
  { id: "s3", pm: "Jake Rivera", pmInitials: "JR", date: "Tue, Apr 8", time: "1:00 PM", distance: "7.8 mi", reason: "Available same day" },
  { id: "s4", pm: "Jake Rivera", pmInitials: "JR", date: "Thu, Apr 10", time: "9:00 AM", distance: "7.8 mi", reason: "Morning slot" },
  { id: "s5", pm: "Anna Kowalski", pmInitials: "AK", date: "Wed, Apr 9", time: "10:00 AM", distance: "11.3 mi", reason: "Bilingual (Spanish)" },
];

function BookLeadSheet({ open, onOpenChange, thread }: { open: boolean; onOpenChange: (v: boolean) => void; thread: MockThread }) {
  const [step, setStep] = useState<"info" | "schedule">("info");
  const [selectedSlot, setSelectedSlot] = useState<string | null>("s1");
  const [manualMode, setManualMode] = useState(false);

  const handleClose = (v: boolean) => {
    if (!v) { setStep("info"); setSelectedSlot("s1"); setManualMode(false); }
    onOpenChange(v);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        {step === "info" ? (
          <>
            <SheetHeader>
              <SheetTitle>Book Lead</SheetTitle>
              <SheetDescription>Create a new lead from this conversation</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input placeholder="First name" />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input placeholder="Last name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input defaultValue={thread.phone} />
              </div>
              <div className="space-y-2">
                <Label>Property address</Label>
                <Input placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input defaultValue="CO" />
                </div>
                <div className="space-y-2">
                  <Label>Zip</Label>
                  <Input placeholder="80903" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>What do they need?</Label>
                <Textarea placeholder="Roof leak, storm damage, gutters, etc." rows={3} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Lead source</Label>
                <Select defaultValue={thread.source ?? ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Google Ads — Roof Repair">Google Ads — Roof Repair</SelectItem>
                    <SelectItem value="Nextdoor Ad — Hail Season">Nextdoor Ad — Hail Season</SelectItem>
                    <SelectItem value="Yard Sign — Briargate">Yard Sign — Briargate</SelectItem>
                    <SelectItem value="Yard Sign — Falcon">Yard Sign — Falcon</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Website Form">Website Form</SelectItem>
                    <SelectItem value="Door Knock">Door Knock</SelectItem>
                  </SelectContent>
                </Select>
                {thread.source && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Megaphone className="h-3 w-3" />
                    Auto-detected from tracking number {thread.trackingNumber}
                  </p>
                )}
              </div>
              <Button className="w-full" onClick={() => setStep("schedule")}>
                Next: Schedule Inspection
              </Button>
            </div>
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>Schedule Inspection</SheetTitle>
              <SheetDescription>Pick a time — ranked by PM rotation and proximity</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              {/* Location context */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Property location</p>
                      <p className="text-muted-foreground">Briargate area · Colorado Springs, CO 80920</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!manualMode ? (
                <>
                  {/* Smart suggestions */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Recommended slots</Label>
                    <div className="space-y-2">
                      {MOCK_SLOTS.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                            selectedSlot === slot.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:bg-accent",
                            slot.recommended && selectedSlot !== slot.id && "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
                          )}
                        >
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarFallback className="text-xs">{slot.pmInitials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm">{slot.pm}</span>
                              {slot.recommended && (
                                <Badge variant="outline" className="text-[10px] border-green-300 text-green-700 dark:text-green-400">
                                  Best match
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CalendarDays className="h-3 w-3 text-muted-foreground" />
                              <span>{slot.date}, {slot.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="h-3 w-3" />
                              <span>{slot.distance} away</span>
                              <span>&middot;</span>
                              <span>{slot.reason}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setManualMode(true)}
                    className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    Override: pick PM &amp; time manually
                  </button>
                </>
              ) : (
                <>
                  {/* Manual override */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Project Manager</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select PM…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mike">Mike Torres</SelectItem>
                          <SelectItem value="jake">Jake Rivera</SelectItem>
                          <SelectItem value="anna">Anna Kowalski</SelectItem>
                          <SelectItem value="chris">Chris Park</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input type="time" />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setManualMode(false)}
                    className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    Back to recommended slots
                  </button>
                </>
              )}

              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("info")}>
                  Back
                </Button>
                <Button className="flex-1">
                  Book Inspection
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AddContactSheet({ open, onOpenChange, thread }: { open: boolean; onOpenChange: (v: boolean) => void; thread: MockThread }) {
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
              <Input placeholder="First name" />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input placeholder="Last name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input defaultValue={thread.phone} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input placeholder="email@example.com" type="email" />
          </div>
          <div className="space-y-2">
            <Label>Contact type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
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
            <Textarea placeholder="How do you know this person?" rows={3} />
          </div>
          <Button className="w-full">Add Contact</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CustomerContext({ thread }: { thread: MockThread }) {
  const [bookLeadOpen, setBookLeadOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);

  if (!thread.customer) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center space-y-3 py-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Unknown Caller</p>
            <p className="text-sm text-muted-foreground">{thread.phone}</p>
          </div>
        </div>

        {/* Source from tracking number */}
        {thread.source && (
          <Card>
            <CardContent className="pt-4 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{thread.source}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Called {thread.trackingNumber}
              </p>
            </CardContent>
          </Card>
        )}

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
        <BookLeadSheet open={bookLeadOpen} onOpenChange={setBookLeadOpen} thread={thread} />
        <AddContactSheet open={addContactOpen} onOpenChange={setAddContactOpen} thread={thread} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Customer card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Customer</CardTitle>
            <Badge variant="outline" className="text-xs">
              {thread.customer.type === "contact" ? "Contact" : "Lead"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{thread.customer.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{thread.customer.phone}</span>
          </div>
          {thread.customer.email && (
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{thread.customer.email}</span>
            </div>
          )}
          {thread.customer.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground">{thread.customer.address}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job card */}
      {thread.job && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Active Job</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Open
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{thread.job.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{thread.job.id}</span>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Stage</p>
                <Badge variant="outline" className="mt-1 text-xs">{thread.job.stage}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payor</p>
                <Badge variant="outline" className="mt-1 text-xs">{thread.job.payor}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source */}
      {thread.source && (
        <Card>
          <CardContent className="pt-4 space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{thread.source}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Called {thread.trackingNumber}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="space-y-2">
        <Button variant="outline" size="sm" className="w-full justify-start">
          <CalendarDays className="h-4 w-4 mr-2" />
          Schedule Appointment
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Clock className="h-4 w-4 mr-2" />
          Set Follow-Up
        </Button>
      </div>
    </div>
  );
}

// ── Incoming Call Notification ────────────────────────────

function IncomingCallNotification({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-background border-2 border-green-500 rounded-2xl shadow-2xl p-5 w-80">
        {/* Ringing indicator */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white">
              <PhoneIncoming className="h-6 w-6" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-green-600 uppercase tracking-wider">
              Incoming Call
            </p>
            <p className="font-semibold text-lg leading-tight">(719) 555-0371</p>
            <p className="text-sm text-muted-foreground">
              Unknown caller &middot; {elapsed}s
            </p>
          </div>
        </div>

        {/* Source from tracking number */}
        <div className="bg-muted rounded-lg px-3 py-2 mb-3 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Megaphone className="h-3.5 w-3.5" />
            <span>Called <span className="font-medium text-foreground">(719) 555-8002</span></span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Yard Sign — Briargate</p>
        </div>

        {/* Customer match hint */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mb-4 text-sm">
          <span className="text-amber-800 dark:text-amber-200">No matching customer — </span>
          <span className="font-medium text-amber-900 dark:text-amber-100">new caller</span>
        </div>

        {/* Accept / Decline */}
        <div className="flex gap-3">
          <Button
            onClick={onAccept}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Phone className="h-4 w-4 mr-2" />
            Accept
          </Button>
          <Button
            onClick={onDecline}
            variant="destructive"
            className="flex-1"
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Mockup ──────────────────────────────────────────

export function ConversationsMockup() {
  const [selectedId, setSelectedId] = useState("1");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("open");
  const filteredThreads = MOCK_THREADS.filter(
    (t) => filter === "all" || t.status === filter
  );
  const selected = MOCK_THREADS.find((t) => t.id === selectedId)!;
  const [showIncoming, setShowIncoming] = useState(false);

  // Simulate an incoming call after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowIncoming(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
    {showIncoming && (
      <IncomingCallNotification
        onAccept={() => {
          setShowIncoming(false);
          setSelectedId("3"); // Switch to the unknown caller thread
        }}
        onDecline={() => setShowIncoming(false)}
      />
    )}
    <ResizablePanelGroup orientation="horizontal" className="h-full flex-row border-t">
      {/* Thread list */}
      <ResizablePanel defaultSize="35%" minSize="20%" maxSize="45%">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-shrink-0 p-4 space-y-3 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Conversations</h2>
              <Button size="sm" variant="default">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search…" className="pl-8" />
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
                  {f === "open" && (
                    <span className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] px-1">
                      {MOCK_THREADS.filter((t) => t.status === "open").length}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
          <ScrollArea className="flex-1">
            {filteredThreads.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                selected={selectedId === thread.id}
                onClick={() => setSelectedId(thread.id)}
              />
            ))}
            {filteredThreads.length === 0 && (
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
          {/* Conversation header */}
          <div className="flex-shrink-0 p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {selected.name[0] === "(" ? "?" : selected.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selected.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{selected.phone}</span>
                    {selected.source && (
                      <>
                        <span>&middot;</span>
                        <span className="flex items-center gap-1">
                          <Megaphone className="h-3 w-3" />
                          {selected.source}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={selected.status === "open" ? "default" : "secondary"}>
                  {selected.status}
                </Badge>
                <Button size="sm" variant="outline" title="Call">
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {selected.messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
            </div>
          </ScrollArea>

          {/* Compose area */}
          <div className="flex-shrink-0 p-4 border-t">
            <div className="flex gap-2">
              <Input placeholder="Type a message…" className="flex-1" />
              <Button>Send</Button>
            </div>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Customer context panel */}
      <ResizablePanel defaultSize="25%" minSize="20%" maxSize="35%">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-shrink-0 p-4 border-b">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customer</h3>
          </div>
          <ScrollArea className="flex-1">
            <CustomerContext thread={selected} />
          </ScrollArea>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
    </>
  );
}
