import {
  Banknote,
  CreditCard,
  Gauge,
  LayoutDashboard,
  type LucideIcon,
  MessageSquare,
  Users,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Unisecure",
    items: [
      {
        title: "Overview",
        url: "/admin/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Users",
        url: "/admin/users",
        icon: Users,
      },
      {
        title: "Payments",
        url: "/admin/payments",
        icon: CreditCard,
      },
      {
        title: "Subscriptions",
        url: "/admin/subscriptions",
        icon: Banknote,
      },
      {
        title: "Usage",
        url: "/admin/usage",
        icon: Gauge,
      },
    ],
  },
  {
    id: 2,
    label: "App",
    items: [
      {
        title: "Chat",
        url: "/chat",
        icon: MessageSquare,
        newTab: false,
      },
    ],
  },
];
