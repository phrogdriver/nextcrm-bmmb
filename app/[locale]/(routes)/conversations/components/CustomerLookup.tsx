"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Plus, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { searchCustomerByPhone, type CustomerMatch } from "@/actions/crm/conversations/search-customer-by-phone";
import { updateConversation } from "@/actions/crm/conversations/update-conversation";
import { QuickLeadForm } from "./QuickLeadForm";

interface Props {
  conversationId: string;
  phoneNumber: string | null;
  onLinked: () => void;
}

export function CustomerLookup({ conversationId, phoneNumber, onLinked }: Props) {
  const t = useTranslations("Conversations");
  const [query, setQuery] = useState(phoneNumber ?? "");
  const [matches, setMatches] = useState<CustomerMatch[]>([]);
  const [searched, setSearched] = useState(false);
  const [linking, setLinking] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);

  // Auto-search on mount if we have a phone number
  useEffect(() => {
    if (phoneNumber && phoneNumber.length >= 3) {
      searchCustomerByPhone(phoneNumber).then(({ data }) => {
        setMatches(data);
        setSearched(true);
      });
    }
  }, [phoneNumber]);

  const handleSearch = async () => {
    if (query.length < 3) return;
    const { data } = await searchCustomerByPhone(query);
    setMatches(data);
    setSearched(true);
  };

  const handleLink = async (match: CustomerMatch) => {
    setLinking(true);
    const result = await updateConversation({
      id: conversationId,
      contactId: match.type === "contact" ? match.id : undefined,
      leadId: match.type === "lead" ? match.id : undefined,
    });
    setLinking(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("customerLinked"));
      onLinked();
    }
  };

  const handleLeadCreated = (leadId: string) => {
    setShowLeadForm(false);
    // Link the new lead to the conversation
    updateConversation({ id: conversationId, leadId }).then((result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("leadCreatedAndLinked"));
        onLinked();
      }
    });
  };

  return (
    <div className="p-4 bg-muted/50 space-y-3">
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{t("lookupCustomer")}</span>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchByPhone")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch}>
          {t("search")}
        </Button>
      </div>
      {matches.length > 0 && (
        <div className="border rounded-md divide-y bg-background">
          {matches.map((m) => (
            <div
              key={`${m.type}-${m.id}`}
              className="flex items-center justify-between p-2"
            >
              <div>
                <span className="text-sm font-medium">
                  {[m.firstName, m.lastName].filter(Boolean).join(" ")}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {m.type === "contact" ? "Contact" : "Lead"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{m.phone}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleLink(m)}
                disabled={linking}
              >
                {t("link")}
              </Button>
            </div>
          ))}
        </div>
      )}
      {searched && matches.length === 0 && (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">{t("noMatchFound")}</p>
          <Button variant="outline" size="sm" onClick={() => setShowLeadForm(true)}>
            <Plus className="h-3 w-3 mr-1" />
            {t("createLead")}
          </Button>
        </div>
      )}
      <QuickLeadForm
        open={showLeadForm}
        onOpenChange={setShowLeadForm}
        phoneNumber={phoneNumber}
        onCreated={handleLeadCreated}
      />
    </div>
  );
}
