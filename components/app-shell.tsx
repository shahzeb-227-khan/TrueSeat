"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { DeleteAccountButton } from "@/components/delete-account-button";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/cases", label: "Verify a new offer", icon: "add_circle" },
  { href: "/cases", label: "My cases", icon: "folder_shared" },
  { href: "/registries", label: "Official registries", icon: "account_balance" },
  { href: "/guide", label: "Scam alerts & FIA guide", icon: "shield" },
];

function isActive(pathname: string, href: string) {
  if (href === "/cases") return pathname === "/cases";
  return pathname.startsWith(href);
}

export function AppShell({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface-canvas">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col justify-between border-r border-border-prominent bg-surface-canvas p-5">
        <div className="flex flex-col gap-6">
          <Link href="/cases" className="flex items-center gap-3 px-1 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border-prominent bg-surface-card text-primary shadow-inner">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline text-xl font-medium leading-none tracking-tight text-text-headline">
                TrueSeat
              </span>
              <span className="mt-1 font-sans text-[11px] uppercase tracking-wider text-text-metadata">
                Offer verification
              </span>
            </div>
          </Link>

          <nav className="mt-2 flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "relative flex items-center gap-3 overflow-hidden rounded-lg border border-primary/30 bg-emerald-950/40 px-3.5 py-2.5 text-sm font-medium text-primary shadow-sm"
                      : "flex items-center gap-3 rounded-lg border border-transparent px-3.5 py-2.5 text-sm text-text-body transition-all duration-150 hover:border-border-subtle hover:bg-surface-card hover:text-text-headline"
                  }
                >
                  {active ? (
                    <span className="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r bg-primary" />
                  ) : null}
                  <span
                    className={
                      active
                        ? "material-symbols-outlined text-[19px]"
                        : "material-symbols-outlined text-[19px] text-text-metadata"
                    }
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Account panel — real account info, no fabricated claims */}
        <div className="flex flex-col gap-2 rounded-lg border border-border-prominent bg-surface-card p-3.5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] uppercase tracking-wider text-text-metadata">
              Signed in
            </span>
            <span className="rounded border border-primary/30 bg-surface-canvas px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
              AAL2
            </span>
          </div>
          <p className="truncate font-sans text-xs leading-relaxed text-text-body">
            {userEmail ?? "Unknown account"}
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <SignOutButton />
            <DeleteAccountButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="pl-72">
        <header className="fixed left-72 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border-prominent bg-surface-canvas/90 px-8 backdrop-blur-md">
          <p className="font-sans text-xs text-text-metadata">
            Not affiliated with any government body, embassy or university. Verdicts are checks, not guarantees —
            always confirm with the university directly before paying.
          </p>
        </header>
        <main className="relative min-h-screen w-full bg-surface-canvas px-8 pb-16 pt-24">
          <div className="mx-auto flex w-full max-w-7xl flex-col">{children}</div>
        </main>
      </div>
    </div>
  );
}
