import {
  Activity,
  Car,
  FlaskConical,
  LayoutDashboard,
  Leaf,
  Route as RouteIcon,
  Scale,
  ScrollText,
  Settings,
  TrafficCone,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import type { NavKey } from "@/lib/navigation";

export const NAV_ICONS: Record<NavKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  predictions: Activity,
  signals: TrafficCone,
  accidents: TriangleAlert,
  routes: RouteIcon,
  commuter: Car,
  impact: Leaf,
  audit: ScrollText,
  scenarios: FlaskConical,
  responsibleAi: Scale,
  settings: Settings,
};
