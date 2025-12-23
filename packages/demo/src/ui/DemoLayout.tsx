import { Link, Outlet, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

export type DemoNavItem = {
  label: string;
  href: string;
  items?: DemoNavItem[];
};

type DemoLayoutProps = {
  title: string;
  navigation: DemoNavItem[];
};

export function DemoLayout({ navigation, title }: DemoLayoutProps): ReactNode {
  const location = useLocation();

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 md:block">
        <div className="sticky top-0 flex h-full flex-col overflow-y-auto p-4">
          <h1 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h1>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive =
                location.pathname === item.href ||
                location.pathname.startsWith(`${item.href}/`);
              return (
                <div key={item.href}>
                  <Link
                    className={`block rounded-md px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-slate-200 font-medium text-slate-900 dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    }`}
                    to={item.href}
                  >
                    {item.label}
                  </Link>
                  {item.items && isActive && (
                    <div className="ml-3 mt-1 space-y-1 border-l border-slate-200 pl-3 dark:border-slate-700">
                      {item.items.map((subItem) => {
                        const isSubActive = location.pathname === subItem.href;
                        return (
                          <Link
                            className={`block rounded-md px-2 py-1.5 text-xs transition ${
                              isSubActive
                                ? "font-medium text-slate-900 dark:text-white"
                                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            }`}
                            key={subItem.href}
                            to={subItem.href}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800 md:hidden">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h1>
        </header>

        {/* Main content */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
