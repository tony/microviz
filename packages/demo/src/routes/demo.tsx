import { createFileRoute } from "@tanstack/react-router";
import { DemoLayout, type DemoNavItem } from "../ui/DemoLayout";

const navigation: DemoNavItem[] = [
  {
    href: "/demo",
    label: "Overview",
  },
  {
    href: "/demo/ux",
    items: [
      { href: "/demo/ux/button", label: "Button" },
      { href: "/demo/ux/tab-toggle", label: "TabToggle" },
    ],
    label: "UX Components",
  },
];

export const Route = createFileRoute("/demo")({
  component: DemoRoute,
});

function DemoRoute() {
  return <DemoLayout navigation={navigation} title="Demo" />;
}
