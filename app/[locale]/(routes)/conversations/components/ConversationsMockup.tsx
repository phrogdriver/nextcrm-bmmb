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

function BookLeadSheet({ open, onOpenChange, thread }: { open: boolean; onOpenChange: (v: boolean) => void; thread: MockThread }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
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
          <Button className="w-full">Create Lead</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AddContactSheet({ open, onOpenChange, thread }: { open: boolean; onOpenChange: (v: boolean) => void; thread: MockThread }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
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
    <ResizablePanelGroup orientation="horizontal" className="h-full min-h-[700px] flex-row rounded-lg border">
      {/* Thread list */}
      <ResizablePanel defaultSize="35%" minSize="20%" maxSize="45%">
        <div className="flex flex-col h-full">
          <div className="p-4 space-y-3 border-b">
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
        <div className="flex flex-col h-full">
          {/* Conversation header */}
          <div className="p-4 border-b">
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
          <div className="p-4 border-t">
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
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
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
