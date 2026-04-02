"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import { createConversation } from "@/actions/crm/conversations/create-conversation";
import { searchCustomerByPhone, type CustomerMatch } from "@/actions/crm/conversations/search-customer-by-phone";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function NewConversationSheet({ open, onOpenChange, onCreated }: Props) {
  const t = useTranslations("Conversations");
  const [channel, setChannel] = useState<"phone" | "sms" | "chat">("phone");
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
      channel,
      phoneNumber: phoneNumber || undefined,
      contactId: selectedMatch?.type === "contact" ? selectedMatch.id : undefined,
      leadId: selectedMatch?.type === "lead" ? selectedMatch.id : undefined,
    });
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("created"));
      setChannel("phone");
      setPhoneNumber("");
      setMatches([]);
      setSelectedMatch(null);
      onCreated();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("newConversation")}</SheetTitle>
          <SheetDescription>{t("newConversationDesc")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>{t("channel")}</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as "phone" | "sms" | "chat")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">{t("channelPhone")}</SelectItem>
                <SelectItem value="sms">{t("channelSms")}</SelectItem>
                <SelectItem value="chat">{t("channelChat")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("phoneNumber")}</Label>
            <Input
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onBlur={handlePhoneBlur}
            />
          </div>
          {matches.length > 0 && (
            <div className="space-y-2">
              <Label>{t("matchingCustomers")}</Label>
              <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {matches.map((m) => (
                  <button
                    key={`${m.type}-${m.id}`}
                    onClick={() => setSelectedMatch(m)}
                    className={`w-full p-2 text-left text-sm hover:bg-accent ${
                      selectedMatch?.id === m.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="font-medium">
                      {[m.firstName, m.lastName].filter(Boolean).join(" ")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {m.type === "contact" ? "Contact" : "Lead"} &middot; {m.phone}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? t("creating") : t("createConversation")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
