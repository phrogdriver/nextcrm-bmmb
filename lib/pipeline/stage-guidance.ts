/**
 * Stage Guidance — Centralized content for pipeline stage help panels.
 *
 * Edit this file to update guidance text shown on the job detail page.
 * Each key matches a stage name in crm_Opportunities_Sales_Stages.
 *
 * Format:
 *   title: Short heading for the guidance panel
 *   text: Markdown explanation — what this stage means, what to do
 *   checklist: Action items to complete before advancing (optional)
 */

export type StageGuidance = {
  title: string;
  text: string;
  checklist?: string[];
};

export const stageGuidance: Record<string, StageGuidance> = {
  // ─── Lead ──────────────────────────────────────────────────

  "New Prospect": {
    title: "New Prospect Received",
    text: "A new lead has entered the system. Confirm the job details (name, address, phone, project type) and assign a sales rep.\n\nIf this is a duplicate, merge with the existing contact.",
    checklist: [
      "Verify contact info (name, phone, email)",
      "Confirm property address",
      "Set project type (replacement, repair, etc.)",
      "Assign to a PM/sales rep",
    ],
  },

  "Job Details Confirmed": {
    title: "Job Details Confirmed",
    text: "Contact and property info is verified. Schedule an inspection appointment with the homeowner.",
    checklist: [
      "Schedule inspection date/time",
      "Confirm appointment with homeowner",
      "Assign or reassign rep if needed",
    ],
  },

  "Awaiting Rep Acceptance": {
    title: "Waiting for Rep to Accept",
    text: "The job has been assigned to a PM/sales rep. Waiting for them to accept or request reassignment.",
    checklist: [
      "Rep accepts the assignment",
      "If no response, follow up or reassign",
    ],
  },

  // ─── Inspection ────────────────────────────────────────────

  "Appointment Confirmed": {
    title: "Inspection Appointment Set",
    text: "The homeowner is expecting you. Go inspect the property, document conditions, and take photos.",
    checklist: [
      "Arrive on time",
      "Document roof condition (layers, material, damage)",
      "Take photos and upload to CompanyCam",
      "Note access issues (hand load, dump trailer, etc.)",
      "Order EagleView report if needed",
    ],
  },

  "Reschedule Needed": {
    title: "Reschedule the Inspection",
    text: "The original appointment couldn't happen. Contact the homeowner to reschedule.",
    checklist: [
      "Contact homeowner for new date/time",
      "Update appointment date",
      "Confirm new appointment",
    ],
  },

  "Inspected": {
    title: "Inspection Complete",
    text: "The property has been inspected. Present the proposal to the homeowner — either on the spot or schedule a follow-up.",
    checklist: [
      "Review inspection findings",
      "Prepare or present proposal/estimate",
      "If sold on the spot → Signed Agreement",
      "If needs follow-up → schedule it",
    ],
  },

  // ─── Sales ─────────────────────────────────────────────────

  "Follow Up After Appointment": {
    title: "Follow Up with Homeowner",
    text: "The homeowner didn't sign at the inspection. Follow up to present the proposal again and close the deal.",
    checklist: [
      "Call or visit homeowner",
      "Address objections or questions",
      "Re-present proposal if needed",
      "Set next follow-up date if not closing today",
    ],
  },

  "Future Follow Up": {
    title: "Scheduled for Future Follow Up",
    text: "This homeowner isn't ready yet but wants to be contacted later. A follow-up date has been set.",
    checklist: [
      "Follow up on the scheduled date",
      "Don't let this one go cold",
    ],
  },

  "Proposal Presented": {
    title: "Proposal Has Been Presented",
    text: "The homeowner has seen the proposal. Waiting for their decision.",
    checklist: [
      "Follow up within 24-48 hours",
      "Address any remaining questions",
      "Get signature if ready → Signed Agreement",
    ],
  },

  // ─── Pre-Production ────────────────────────────────────────

  "Signed Agreement": {
    title: "Contract Signed — Job is Sold!",
    text: "The homeowner signed. Now determine the path:\n\n**Insurance job?** File the claim and begin the insurance process.\n**Cash/retail job?** Skip to collecting the customer deposit.",
    checklist: [
      "Record contract signed date",
      "Set payor type (Insurance or Cash/Retail)",
      "If insurance → file the claim",
      "If cash → request customer deposit",
      "Send intro/welcome communication to homeowner",
    ],
  },

  "Claim Filed": {
    title: "Insurance Claim Filed",
    text: "The claim has been submitted to the insurance company. Schedule the adjuster appointment.",
    checklist: [
      "Verify insurance company, policy #, claim #, date of loss are recorded",
      "Schedule adjuster appointment",
      "Prepare documentation for adjuster visit",
    ],
  },

  "Waiting on Adjuster": {
    title: "Waiting for Adjuster Visit",
    text: "The adjuster appointment has been scheduled. Waiting for them to inspect the property.",
    checklist: [
      "Confirm adjuster appointment date",
      "Be present for adjuster visit if possible",
      "Have documentation ready (photos, measurements)",
    ],
  },

  "Adjuster Appointment Complete": {
    title: "Adjuster Has Visited",
    text: "The adjuster has inspected the property. Waiting for the insurance company's claim decision.",
    checklist: [
      "Follow up with insurance company on timeline",
      "Monitor for claim approval or denial",
    ],
  },

  "Waiting Claim": {
    title: "Waiting for Claim Decision",
    text: "The insurance company is reviewing the claim. This can take days to weeks.",
    checklist: [
      "Follow up weekly with insurance company",
      "Keep homeowner informed of status",
      "If denied, discuss options with homeowner",
    ],
  },

  "Claim Approved": {
    title: "Claim Approved!",
    text: "The insurance company approved the claim. Review the approved scope and ACV amount. Determine if supplementing is needed.",
    checklist: [
      "Record date claim approved",
      "Record ACV deposit amount",
      "Review claim summary for scope gaps",
      "If scope is short → begin supplementing",
      "If scope is sufficient → proceed to deposit collection",
    ],
  },

  "Waiting Claim Summary": {
    title: "Waiting for Claim Summary",
    text: "Claim is approved but waiting for the detailed claim summary/scope document from the insurance company.",
    checklist: [
      "Follow up with insurance for claim summary",
      "Review summary when received",
    ],
  },

  "Supplementing": {
    title: "Filing a Supplement",
    text: "The approved scope doesn't cover everything needed. Prepare and submit supplement documentation to the insurance company.",
    checklist: [
      "Document what's missing from the approved scope",
      "Prepare supplement with supporting evidence (photos, measurements, code requirements)",
      "Submit supplement to insurance company",
      "Track supplement amount",
    ],
  },

  "Waiting Customer Deposit": {
    title: "Collect Customer Deposit",
    text: "The job is approved and ready. Collect the customer's deposit (deductible for insurance, or deposit for cash) before scheduling production.",
    checklist: [
      "Send deposit request to homeowner",
      "Record deposit amount and date when received",
      "Schedule pre-construction meeting",
    ],
  },

  "Investment": {
    title: "Deposit Received",
    text: "Customer deposit is in. Begin preparing production documents and material lists.",
    checklist: [
      "Prepare production documents (scope, materials, measurements)",
      "Submit for Stage 1 review",
    ],
  },

  "Preparing Production Documents": {
    title: "Preparing Production Docs",
    text: "Compile everything needed for production: scope of work, material list, measurements, and any special instructions.",
    checklist: [
      "Complete material list",
      "Finalize scope of work",
      "Include any special instructions for crew",
      "Submit for Stage 1 review",
    ],
  },

  "Stage 1 Review": {
    title: "Production Documents Under Review",
    text: "Production documents have been submitted for review. Waiting for approval before scheduling.",
    checklist: [
      "Reviewer checks scope, materials, and measurements",
      "Approve or reject with feedback",
    ],
  },

  "Stage 1 Rejected": {
    title: "Production Docs Rejected",
    text: "The production documents were rejected. Review the feedback, fix the issues, and resubmit.",
    checklist: [
      "Review rejection reason",
      "Fix identified issues",
      "Resubmit for review",
    ],
  },

  "Additional Items Required": {
    title: "Additional Items Needed",
    text: "The review identified additional items that need to be addressed before production can proceed.",
    checklist: [
      "Review required additional items",
      "Source or resolve each item",
      "Update production documents",
      "Resubmit when complete",
    ],
  },

  // ─── Production ────────────────────────────────────────────

  "Job Ready for Production": {
    title: "Ready to Schedule!",
    text: "Production documents are approved. Order materials and schedule the build.",
    checklist: [
      "Order materials",
      "Assign superintendent/crew",
      "Set build date",
      "Schedule with homeowner",
    ],
  },

  "Scheduled": {
    title: "Job is Scheduled",
    text: "The build date is set. Materials are ordered. Crew is assigned. Ready to go.",
    checklist: [
      "Confirm materials delivery date",
      "Confirm crew availability",
      "Send reminder to homeowner",
      "Check weather forecast",
    ],
  },

  "On Hold": {
    title: "Job On Hold",
    text: "Production is paused. This could be weather, material delay, customer request, or other issue.",
    checklist: [
      "Document reason for hold",
      "Set expected resume date",
      "Notify homeowner",
      "Reschedule when ready",
    ],
  },

  "Work in Progress": {
    title: "Crew is on the Roof",
    text: "Production is underway. Monitor progress, log updates, and flag any issues.",
    checklist: [
      "Crew logs daily progress",
      "Photos uploaded to CompanyCam",
      "Flag any issues (materials, damage, weather)",
      "Mark complete when finished",
    ],
  },

  // ─── Post-Production ───────────────────────────────────────

  "Project Completed": {
    title: "Build is Done!",
    text: "The roof is complete. Begin the closeout process: final visit, collect remaining payment, handle depreciation (insurance).",
    checklist: [
      "Review quality of work",
      "Schedule final visit with homeowner",
      "If insurance → submit depreciation request",
      "If cash → request final payment",
    ],
  },

  "Post Build Supplement": {
    title: "Post-Build Supplement",
    text: "Additional work was discovered or completed during production that wasn't in the original scope. Submit a post-build supplement to the insurance company.",
    checklist: [
      "Document additional work with photos",
      "Prepare post-build supplement",
      "Submit to insurance company",
      "Track amount and approval",
    ],
  },

  "Depreciation Submitted": {
    title: "Depreciation Request Submitted",
    text: "The depreciation release request has been submitted to the insurance company. Waiting for them to release the held-back depreciation amount.",
    checklist: [
      "Confirm submission",
      "Follow up with insurance company",
      "Track expected payment date",
    ],
  },

  "Waiting on Depreciation": {
    title: "Waiting for Depreciation Release",
    text: "The insurance company is processing the depreciation release. Follow up if it takes more than 2 weeks.",
    checklist: [
      "Monitor for payment",
      "Follow up with insurance if delayed",
      "Keep homeowner informed",
    ],
  },

  "Depreciation Released": {
    title: "Depreciation Payment Released",
    text: "The insurance company released the depreciation. Record the payment and proceed to final visit.",
    checklist: [
      "Record depreciation payment amount and date",
      "Schedule sales final visit",
    ],
  },

  "Sales Final Visit": {
    title: "Final Walkthrough with Homeowner",
    text: "Visit the homeowner to review the completed work, collect any remaining balance, and ensure satisfaction.",
    checklist: [
      "Walk the property with homeowner",
      "Address any concerns",
      "Collect remaining balance if applicable",
      "Request review/referral",
    ],
  },

  "Awaiting Final Payment": {
    title: "Waiting for Final Payment",
    text: "Final visit is complete. Waiting for the remaining balance to be paid.",
    checklist: [
      "Send final invoice if not already sent",
      "Follow up on payment",
      "Record payment when received",
    ],
  },

  "Ready for Final Email": {
    title: "Send Final Email",
    text: "Payment received. Send the final email to the homeowner with warranty info, maintenance tips, and a thank-you.",
    checklist: [
      "Send final/thank-you email",
      "Include warranty information",
      "Request Google review",
    ],
  },

  "Ready for Commission and Final Checklist": {
    title: "Final Checklist & Commission",
    text: "All payments collected. Review final financials, calculate commission, and complete the closing checklist.",
    checklist: [
      "Verify all payments received (A/R = $0)",
      "Review final job costs and margin",
      "Calculate and record commission",
      "Complete any remaining checklist items",
      "Close the job",
    ],
  },

  // ─── Closed ────────────────────────────────────────────────

  "Closed PIF": {
    title: "Job Closed — Paid in Full",
    text: "This job is complete and fully paid. No further action needed.",
  },

  "Lost Deal": {
    title: "Deal Lost",
    text: "This job was lost. Review the lost deal reason for learning.",
  },

  "Exit": {
    title: "Exited Pipeline",
    text: "This job was removed from the pipeline without a specific lost reason.",
  },
};

/**
 * Get guidance for a stage by name. Returns undefined if no guidance exists.
 */
export function getStageGuidance(stageName: string): StageGuidance | undefined {
  return stageGuidance[stageName];
}

/**
 * Get all stages with guidance, in display order.
 * Useful for the centralized CMS list view.
 */
export function getAllStageGuidance(): { stageName: string; guidance: StageGuidance }[] {
  return Object.entries(stageGuidance).map(([stageName, guidance]) => ({
    stageName,
    guidance,
  }));
}
