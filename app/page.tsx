import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const VERDICTS = [
  { emoji: "🟢", en: "Checks passed", ur: "جانچ مکمل" },
  { emoji: "🟠", en: "Suspicious", ur: "مشکوک" },
  { emoji: "🔴", en: "High risk", ur: "زیادہ خطرہ" },
  { emoji: "⚪", en: "Couldn't verify", ur: "تصدیق ممکن نہیں" },
];

export default async function LandingPage() {
  const supabase = createServerSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/cases");
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/sign-in">
            <Button variant="outline">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button>Sign up</Button>
          </Link>
        </nav>
      </header>

      <section className="mt-16 space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Check your university offer before you pay.
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          TrueSeat checks an admission letter, fee voucher or consultant chat against official
          university registers, sender domains and payment details — and quotes exactly what it
          found, before any money leaves your hands.
        </p>
        <p dir="rtl" className="mx-auto max-w-2xl text-sm text-muted-foreground">
          ٹرو سیٹ آپ کے داخلے کے خط، فیس وصولی اور کنسلٹنٹ چیٹ کو سرکاری یونیورسٹی رجسٹر سے ملا
          کر جانچتی ہے — ادائیگی سے پہلے۔
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/sign-up">
            <Button>Check an offer — it&apos;s free</Button>
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2">
        {VERDICTS.map((v) => (
          <Card key={v.en}>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <span className="text-2xl">{v.emoji}</span>
              <div>
                <CardTitle className="text-base">{v.en}</CardTitle>
                <CardDescription dir="rtl">{v.ur}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="mt-16 space-y-3">
        <h2 className="text-xl font-semibold">What TrueSeat checks</h2>
        <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <li>✓ Institution against the official register (UK, Canada, US)</li>
          <li>✓ Sender domain against the university&apos;s real domain</li>
          <li>✓ Who the payment actually goes to</li>
          <li>✓ Names, amounts and dates across your documents</li>
        </ul>
        <p className="text-xs text-muted-foreground">
          A ✅ result here does not prove an offer is genuine — always confirm directly with the
          university using its official contact. TrueSeat is not affiliated with any government
          body, embassy or university.
        </p>
      </section>

      <footer className="mt-20 border-t pt-6 text-center text-xs text-muted-foreground">
        Built for the Devmarketplace × NED &quot;Build The Next Big Thing with AI&quot; hackathon.
      </footer>
    </main>
  );
}
