import { PrismaClient, gptStatus, UserRole, PermissionValue } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";

// Load .env.local for test user credentials
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/*
Seed data is used to populate the database with initial data.
*/
//GPT Models
import gptModelsDataRaw from "../initial-data/gpt_Models.json";

const gptModelsData = gptModelsDataRaw.map((item) => ({
  ...item,
  status: item.status as gptStatus,
}));
//CRM
import crmOpportunityTypeData from "../initial-data/crm_Opportunities_Type.json";
import crmOpportunitySaleStagesData from "../initial-data/crm_Opportunities_Sales_Stages.json";
import crmCampaignsData from "../initial-data/crm_campaigns.json";
import crmIndustryTypeData from "../initial-data/crm_Industry_Type.json";

// New CRM Config Tables
const contactTypesData = [
  { name: "Customer" },
  { name: "Partner" },
  { name: "Vendor" },
  { name: "Prospect" },
];
const leadSourcesData = [
  { name: "Web" },
  { name: "Referral" },
  { name: "Cold Call" },
  { name: "Email Campaign" },
  { name: "Event" },
  { name: "Other" },
];
const leadStatusesData = [
  { name: "New" },
  { name: "Contacted" },
  { name: "Qualified" },
  { name: "Lost" },
];
const leadTypesData = [{ name: "Demo" }];

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  // Your seeding logic here using Prisma Client
  console.log("-------- Seeding DB --------");

  //Seed CRM Opportunity Types
  const crmOpportunityType = await prisma.crm_Opportunities_Type.findMany();

  if (crmOpportunityType.length === 0) {
    await prisma.crm_Opportunities_Type.createMany({
      data: crmOpportunityTypeData,
    });
    console.log("Opportunity Types seeded successfully");
  } else {
    console.log("Opportunity Types already seeded");
  }

  const crmOpportunitySaleStages =
    await prisma.crm_Opportunities_Sales_Stages.findMany();

  if (crmOpportunitySaleStages.length === 0) {
    await prisma.crm_Opportunities_Sales_Stages.createMany({
      data: crmOpportunitySaleStagesData,
    });
    console.log("Opportunity Sales Stages seeded successfully");
  } else {
    console.log("Opportunity Sales Stages already seeded");
  }

  const crmCampaigns = await prisma.crm_campaigns.findMany();

  if (crmCampaigns.length === 0) {
    await prisma.crm_campaigns.createMany({
      data: crmCampaignsData,
    });
    console.log("Campaigns seeded successfully");
  } else {
    console.log("Campaigns already seeded");
  }

  const crmIndustryType = await prisma.crm_Industry_Type.findMany();

  if (crmIndustryType.length === 0) {
    await prisma.crm_Industry_Type.createMany({
      data: crmIndustryTypeData,
    });
    console.log("Industry Types seeded successfully");
  } else {
    console.log("Industry Types already seeded");
  }

  //Seed GPT Models
  const gptModels = await prisma.gpt_models.findMany();

  if (gptModels.length === 0) {
    await prisma.gpt_models.createMany({
      data: gptModelsData,
    });
    console.log("GPT Models seeded successfully");
  } else {
    console.log("GPT Models already seeded");
  }

  //Seed Test User for E2E Testing
  const testUserEmail = process.env.TEST_USER_EMAIL || "test@nextcrm.app";
  const testUserPassword =
    process.env.TEST_USER_PASSWORD || "Som3Co0lP4ssw0rd123!";

  const existingTestUser = await prisma.users.findUnique({
    where: { email: testUserEmail },
  });

  const hashedPassword = await bcrypt.hash(testUserPassword, 10);

  if (!existingTestUser) {
    await prisma.users.create({
      data: {
        email: testUserEmail,
        name: "Test User",
        password: hashedPassword,
        userStatus: "ACTIVE",
        is_admin: true,
        is_account_admin: true,
        role: "ADMIN",
      },
    });
    console.log(`Test user created: ${testUserEmail}`);
  } else {
    // Update password and status to ensure it matches env vars
    await prisma.users.update({
      where: { email: testUserEmail },
      data: {
        password: hashedPassword,
        userStatus: "ACTIVE",
        is_admin: true,
        is_account_admin: true,
        role: "ADMIN",
      },
    });
    console.log(`Test user updated: ${testUserEmail}`);
  }

  const contactTypes = await prisma.crm_Contact_Types.findMany();
  if (contactTypes.length === 0) {
    await prisma.crm_Contact_Types.createMany({ data: contactTypesData });
    console.log("Contact Types seeded successfully");
  } else {
    console.log("Contact Types already seeded");
  }

  const leadSources = await prisma.crm_Lead_Sources.findMany();
  if (leadSources.length === 0) {
    await prisma.crm_Lead_Sources.createMany({ data: leadSourcesData });
    console.log("Lead Sources seeded successfully");
  } else {
    console.log("Lead Sources already seeded");
  }

  const leadStatuses = await prisma.crm_Lead_Statuses.findMany();
  if (leadStatuses.length === 0) {
    await prisma.crm_Lead_Statuses.createMany({ data: leadStatusesData });
    console.log("Lead Statuses seeded successfully");
  } else {
    console.log("Lead Statuses already seeded");
  }

  const leadTypes = await prisma.crm_Lead_Types.findMany();
  if (leadTypes.length === 0) {
    await prisma.crm_Lead_Types.createMany({ data: leadTypesData });
    console.log("Lead Types seeded successfully");
  } else {
    console.log("Lead Types already seeded");
  }

  // Seed Role Permissions
  const existingPerms = await prisma.rolePermission.findMany();
  if (existingPerms.length === 0) {
    const A = PermissionValue.ALLOW;
    const D = PermissionValue.DENY;
    const O = PermissionValue.OWN;

    const matrix: Record<string, Record<UserRole, PermissionValue>> = {
      view_all_leads:                 { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: O, SUBCONTRACTOR: D },
      create_edit_leads:              { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: O, SUBCONTRACTOR: D },
      view_pipeline:                  { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: A, PROJECT_MANAGER: O, SUBCONTRACTOR: D },
      create_estimates:               { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: D, PRODUCTION_MANAGER: D, PROJECT_MANAGER: A, SUBCONTRACTOR: D },
      approve_estimates:              { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: D, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
      schedule_jobs:                  { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: D, PRODUCTION_MANAGER: A, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
      dispatch_board:                 { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: D, PRODUCTION_MANAGER: A, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
      update_job_status:              { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: A, PROJECT_MANAGER: O, SUBCONTRACTOR: O },
      upload_job_photos:              { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: A, PROJECT_MANAGER: A, SUBCONTRACTOR: A },
      view_job_cost_margin:           { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: A, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
      create_invoices:                { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
      view_revenue_reports:           { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: O, SUBCONTRACTOR: D },
      collect_payments:               { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: A, SUBCONTRACTOR: D },
      insurance_depreciation_tracking:{ ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
      answer_log_calls:               { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
      send_sms_email:                 { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: A, PROJECT_MANAGER: O, SUBCONTRACTOR: D },
      manage_users_roles:             { ADMIN: A, GENERAL_MANAGER: O, CUSTOMER_CARE: D, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
      system_settings:                { ADMIN: A, GENERAL_MANAGER: D, CUSTOMER_CARE: D, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
      manage_integrations:            { ADMIN: A, GENERAL_MANAGER: D, CUSTOMER_CARE: D, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
      view_audit_log:                 { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
      delete_records:                 { ADMIN: A, GENERAL_MANAGER: O, CUSTOMER_CARE: D, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
      export_data:                    { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
      bulk_actions:                   { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: A, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
    };

    const rows: { role: UserRole; permission: string; value: PermissionValue }[] = [];
    for (const [permission, roles] of Object.entries(matrix)) {
      for (const [role, value] of Object.entries(roles)) {
        rows.push({ role: role as UserRole, permission, value });
      }
    }

    await prisma.rolePermission.createMany({ data: rows });
    console.log(`Role Permissions seeded: ${rows.length} rows`);
  } else {
    console.log("Role Permissions already seeded");
  }

  // Backfill existing users: is_admin=true → ADMIN, others → PROJECT_MANAGER (default)
  const admins = await prisma.users.updateMany({
    where: { is_admin: true },
    data: { role: "ADMIN" },
  });
  if (admins.count > 0) {
    console.log(`Backfilled ${admins.count} admin user(s) with ADMIN role`);
  }

  console.log("-------- Seed DB completed --------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
