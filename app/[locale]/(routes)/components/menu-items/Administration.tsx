import { Wrench } from "lucide-react";
import { NavItem } from "../nav-main";

type Props = {
  title: string;
};

export const getAdministrationMenuItem = ({ title }: Props): NavItem => {
  return {
    title,
    url: "/admin",
    icon: Wrench,
    items: [
      { title: "LLM Keys", url: "/admin/llm-keys" },
      { title: "Users", url: "/admin/users" },
      { title: "Roles", url: "/admin/roles" },
      { title: "CRM Settings", url: "/admin/crm-settings" },
      { title: "Audit Log", url: "/admin/audit-log" },
    ],
  };
};

export default getAdministrationMenuItem;
