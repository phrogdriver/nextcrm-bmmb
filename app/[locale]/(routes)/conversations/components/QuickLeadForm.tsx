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

import { createLead } from "@/actions/crm/leads/create-lead";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string | null;
  onCreated: (leadId: string) => void;
}

export function QuickLeadForm({ open, onOpenChange, phoneNumber, onCreated }: Props) {
  const t = useTranslations("Conversations");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(phoneNumber ?? "");
  const [request, setRequest] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!lastName.trim()) {
      toast.error(t("lastNameRequired"));
      return;
    }

    setSubmitting(true);
    const result = await createLead({
      first_name: firstName || undefined,
      last_name: lastName,
      phone: phone || undefined,
      request: request || undefined,
    });
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setFirstName("");
      setLastName("");
      setRequest("");
      onCreated(result.data.id);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("createLead")}</SheetTitle>
          <SheetDescription>{t("createLeadDesc")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("firstName")}</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("lastName")}</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("phone")}</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("request")}</Label>
            <Textarea
              placeholder={t("requestPlaceholder")}
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? t("saving") : t("createLead")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
