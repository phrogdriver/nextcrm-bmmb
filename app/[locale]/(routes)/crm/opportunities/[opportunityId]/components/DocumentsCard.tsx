"use client";

import { FileText, Upload, CheckCircle2, AlertCircle, ExternalLink, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsibleCard } from "@/components/crm/CollapsibleCard";
import { cn } from "@/lib/utils";

type RequiredDoc = {
  name: string;
  uploaded: boolean;
  uploadedDate?: string;
  uploadedBy?: string;
  missingNote?: string;
};

type Attachment = {
  name: string;
  uploadedDate: string;
  uploadedBy: string;
  size: string;
  isImage?: boolean;
};

const MOCK_REQUIRED: RequiredDoc[] = [
  { name: "Contingency Contract", uploaded: true, uploadedDate: "Mar 5", uploadedBy: "Jackson Coffin" },
  { name: "Original Claim Summary", uploaded: true, uploadedDate: "Mar 21", uploadedBy: "Jackson Coffin" },
  { name: "Final Authorization Contract", uploaded: false, missingNote: "Missing — required before production" },
  { name: "Supplement Documentation", uploaded: false, missingNote: "Missing" },
  { name: "EagleView Report", uploaded: true, uploadedDate: "Feb 15", uploadedBy: "System" },
];

const MOCK_ATTACHMENTS: Attachment[] = [
  { name: "Permit_Receipt_23339.pdf", uploadedDate: "Mar 25", uploadedBy: "Jackson Coffin", size: "245 KB" },
  { name: "Adjuster_scope_letter.pdf", uploadedDate: "Mar 21", uploadedBy: "Jackson Coffin", size: "1.2 MB", isImage: true },
  { name: "Insurance_correspondence_03-18.pdf", uploadedDate: "Mar 18", uploadedBy: "Jackson Coffin", size: "89 KB" },
];

export function DocumentsCard() {
  const uploadedCount = MOCK_REQUIRED.filter((d) => d.uploaded).length;
  const missingCount = MOCK_REQUIRED.length - uploadedCount;

  return (
    <CollapsibleCard
      title="Documents"
      icon={FileText}
      summary={
        <>{uploadedCount}/{MOCK_REQUIRED.length} required · {MOCK_ATTACHMENTS.length} attachments{missingCount > 0 && <> · <span className="text-orange-500">{missingCount} missing</span></>}</>
      }
      actions={
        <Button variant="outline" size="sm">
          <Upload className="h-3.5 w-3.5 mr-1" />
          Upload
        </Button>
      }
    >
      {/* Required Documents */}
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground pb-1.5 border-b mb-0">
        Required Documents
      </div>
      <div className="space-y-0">
        {MOCK_REQUIRED.map((doc, i) => (
          <div key={i} className="flex items-center gap-2.5 py-2 border-b last:border-b-0">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                doc.uploaded ? "bg-green-100 text-green-600" : "bg-amber-100 text-orange-500"
              )}
            >
              {doc.uploaded ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{doc.name}</div>
              {doc.uploaded ? (
                <div className="text-xs text-muted-foreground">
                  Uploaded {doc.uploadedDate} · {doc.uploadedBy}
                </div>
              ) : (
                <div className="text-xs text-orange-500">{doc.missingNote}</div>
              )}
            </div>
            {doc.uploaded ? (
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
                Upload
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Attachments */}
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground pb-1.5 border-b mt-4 mb-0">
        Attachments
      </div>
      <div className="space-y-0">
        {MOCK_ATTACHMENTS.map((att, i) => (
          <div key={i} className="flex items-center gap-2.5 py-2 border-b last:border-b-0">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
              {att.isImage ? <Image className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{att.name}</div>
              <div className="text-xs text-muted-foreground">
                Uploaded {att.uploadedDate} · {att.uploadedBy} · {att.size}
              </div>
            </div>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
}
