import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import Header from "./components/Header";
import Footer from "./components/Footer";

import { Metadata } from "next";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { getTranslations } from "next-intl/server";
import { AvatarProvider } from "@/context/avatar-context";
import { TwilioProvider } from "@/context/twilio-context";
import { IncomingCallBanner } from "@/components/crm/conversations/IncomingCallBanner";
import { getOpenConversationCount } from "@/actions/crm/conversations/get-conversations";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL! || "http://localhost:3000"
  ),
  title: "",
  description: "",
  openGraph: {
    images: [
      {
        url: "/images/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: "/images/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "",
      },
    ],
  },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  //console.log(session, "session");

  if (!session) {
    return redirect("/sign-in");
  }

  const user = session?.user;

  if (user?.userStatus === "PENDING") {
    return redirect("/pending");
  }

  if (user?.userStatus === "INACTIVE") {
    return redirect("/inactive");
  }

  // Fetch localization dictionary
  const dict = await getTranslations("ModuleMenu");

  // Extract translations as plain object for client component
  const translations = {
    dashboard: dict("dashboard"),
    crm: {
      title: dict("crm.title"),
      accounts: dict("crm.accounts"),
      opportunities: dict("crm.opportunities"),
      contacts: dict("crm.contacts"),
      leads: dict("crm.leads"),
      contracts: dict("crm.contracts"),
      targets: dict("crm.targets"),
      targetLists: dict("crm.targetLists"),
    },
    projects: dict("projects"),
    emails: dict("emails"),
    reports: dict("reports"),
    documents: dict("documents"),
    settings: dict("settings"),
    conversations: dict("conversations"),
  };

  const [cookieStore, conversationsBadge] = await Promise.all([
    cookies(),
    getOpenConversationCount(),
  ]);
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  //console.log(typeof build, "build");
  return (
    <AvatarProvider initialAvatar={user?.image}>
    <TwilioProvider>
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar
        dict={translations}
        session={session}
        conversationsBadge={conversationsBadge}
      />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <div className="flex-shrink-0">
          <Header
            id={session.user.id as string}
            lang={session.user.userLanguage as string}
          />
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto min-w-0">
          <div className="flex-grow py-5 w-full min-w-0">
            <div className="w-full px-4 min-w-0">
              {children}
            </div>
          </div>
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
    <IncomingCallBanner />
    </TwilioProvider>
    </AvatarProvider>
  );
}
