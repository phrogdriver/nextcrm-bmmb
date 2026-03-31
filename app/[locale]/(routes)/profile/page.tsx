// app/[locale]/(routes)/profile/page.tsx
import { Suspense } from "react";
import { getUser } from "@/actions/get-user";
import { getTranslations } from "next-intl/server";

import Container from "../components/ui/Container";
import { ProfileHero } from "./components/ProfileHero";
import { ProfileTabs } from "./components/ProfileTabs";
import { ProfileTabContent } from "./components/tabs/ProfileTabContent";
import { SecurityTabContent } from "./components/tabs/SecurityTabContent";
import { PreferencesTabContent } from "./components/tabs/PreferencesTabContent";
import { DeveloperTabContent } from "./components/tabs/DeveloperTabContent";
import { EmailAccountsTabContent } from "./components/tabs/EmailAccountsTabContent";
import { LlmsTabContent } from "./components/tabs/LlmsTabContent";
import { getUserApiKeys } from "./actions/api-keys";

const ProfilePage = async () => {
  const t = await getTranslations("ProfilePage");
  const data = await getUser();

  if (!data) {
    return <div>No user data.</div>;
  }

  const isAdmin = data.is_admin === true;
  const llmKeys = isAdmin ? await getUserApiKeys() : [];

  return (
    <Container title={t("title")} description={t("description")}>
      <div className="rounded-lg border border-border overflow-hidden">
        <ProfileHero data={data} />
        <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading...</div>}>
          <ProfileTabs
            isAdmin={isAdmin}
            profileContent={<ProfileTabContent data={data} />}
            securityContent={<SecurityTabContent userId={data.id} />}
            preferencesContent={<PreferencesTabContent userId={data.id} />}
            developerContent={isAdmin ? <DeveloperTabContent userId={data.id} /> : null}
            emailsContent={<EmailAccountsTabContent />}
            llmsContent={isAdmin ? <LlmsTabContent initialKeys={llmKeys} /> : null}
          />
        </Suspense>
      </div>
    </Container>
  );
};

export default ProfilePage;
