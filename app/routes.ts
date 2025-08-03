import { codePropDefs } from "@radix-ui/themes/props";
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), route("scan", "routes/scan.tsx"), route("attendees", "routes/attendees.tsx"), route('log-attendance', "routes/log-attendance.tsx"), route('.well-known', "routes/.well-known.$all.tsx"), route('view-qr-codes', "routes/view-qr-codes.tsx")] satisfies RouteConfig;
