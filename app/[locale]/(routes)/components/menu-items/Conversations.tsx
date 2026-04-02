import { MessageSquare } from "lucide-react";
import { NavItem } from "../nav-main";

type Props = {
  title: string;
  badge?: number;
};

export const getConversationsMenuItem = ({ title, badge }: Props): NavItem => {
  return {
    title,
    url: "/conversations",
    icon: MessageSquare,
    badge,
  };
};

export default getConversationsMenuItem;
