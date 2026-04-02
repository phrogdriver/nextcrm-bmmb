"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

import { logCall } from "@/actions/crm/conversations/log-call";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  onLogged: () => void;
}

export function CallLogForm({ open, onOpenChange, conversationId, onLogged }: Props) {
  const t = useTranslations("Conversations");
  const [direction, setDirection] = useState<"inbound" | "outbound">("inbound");
  const [duration, setDuration] = useState("");
  const [outcome, setOutcome] = useState("answered");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const title = `${direction === "inbound" ? "Inbound" : "Outbound"} call — ${outcome}`;
    const result = await logCall({
      conversationId,
      title,
      description: notes || undefined,
      duration: duration ? parseInt(duration, 10) : undefined,
      outcome,
      direction,
    });
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("callLogged"));
      setDirection("inbound");
      setDuration("");
      setOutcome("answered");
      setNotes("");
      onLogged();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("logCall")}</SheetTitle>
          <SheetDescription>{t("logCallDesc")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>{t("direction")}</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as "inbound" | "outbound")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbound">{t("inbound")}</SelectItem>
                <SelectItem value="outbound">{t("outbound")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("duration")}</Label>
            <Input
              type="number"
              placeholder="Minutes"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("outcome")}</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="answered">{t("outcomeAnswered")}</SelectItem>
                <SelectItem value="voicemail">{t("outcomeVoicemail")}</SelectItem>
                <SelectItem value="no-answer">{t("outcomeNoAnswer")}</SelectItem>
                <SelectItem value="busy">{t("outcomeBusy")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("notes")}</Label>
            <Textarea
              placeholder={t("notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? t("saving") : t("logCall")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
