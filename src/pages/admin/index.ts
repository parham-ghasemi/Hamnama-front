import type { ComponentType } from "react";
import AdminAccessGuard from "./access";
import Dashboard from "./dashboard/Dashboard";
import Tickets from "./tickets/Tickets";
import Users from "./users/Users";
import Rooms from "./rooms/Rooms";
import Settings from "./settings/Settings";
import Support from "./support/Support";
import Archive from "./archive/Archive";

const protect = <P extends object>(component: ComponentType<P>, minimumLevel: 1 | 2 | 3) =>
  AdminAccessGuard(component, minimumLevel);

export const AdminDashboard = protect(Dashboard, 1);
export const AdminTickets = protect(Tickets, 1);
export const AdminUsers = protect(Users, 2);
export const AdminRooms = protect(Rooms, 3);
export const AdminSettings = protect(Settings, 2);
export const AdminSupport = protect(Support, 1);
export const AdminArchive = protect(Archive, 3);
