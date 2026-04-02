"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, PhoneOff, PhoneIncoming, Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTwilio } from "@/context/twilio-context";
import { searchCustomerByPhone } from "@/actions/crm/conversations/search-customer-by-phone";

export function IncomingCallBanner() {
  const { callState, accept, reject } = useTwilio();
  const router = useRouter();

  const [elapsed, setElapsed] = useState(0);
  const [customerName, setCustomerName] = useState<string | null>(null);

  const isRinging = callState.status === "ringing" && callState.direction === "inbound";

  // Timer while ringing
  useEffect(() => {
    if (!isRinging) {
      setElapsed(0);
      setCustomerName(null);
      return;
    }

    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isRinging]);

  // Look up customer by phone
  useEffect(() => {
    if (!isRinging || !callState.phoneNumber) return;

    searchCustomerByPhone(callState.phoneNumber).then(({ data }) => {
      if (data.length > 0) {
        const match = data[0];
        setCustomerName([match.firstName, match.lastName].filter(Boolean).join(" "));
      }
    });
  }, [isRinging, callState.phoneNumber]);

  if (!isRinging) return null;

  const handleAccept = () => {
    accept();
    router.push("/en/conversations");
  };

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-background border-2 border-green-500 rounded-2xl shadow-2xl p-5 w-80">
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
            <p className="font-semibold text-lg leading-tight">
              {callState.phoneNumber ?? "Unknown"}
            </p>
            <p className="text-sm text-muted-foreground">
              {customerName ?? "Unknown caller"} &middot; {elapsed}s
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleAccept}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Phone className="h-4 w-4 mr-2" />
            Accept
          </Button>
          <Button
            onClick={reject}
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
