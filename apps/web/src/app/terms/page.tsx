import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "The rules for using Craneá and Craneá Plus.",
  alternates: { languages: { es: "/terminos" } },
};

/** English version of /terminos. Keep both in sync. */
export default function TermsEn() {
  return (
    <LegalPage title="Terms and conditions" lang="en" page="terms">
      <p>
        These terms govern your use of Craneá (the website cranea.app and the app for Android and iOS), run by {LEGAL.owner}. By
        using Craneá you accept them. Our <Link href="/privacy" className="underline underline-offset-4">privacy policy</Link> also applies.
      </p>

      <h2>The service</h2>
      <p>
        Craneá offers logic puzzles. The daily puzzles, tutorials, leaderboard, stats and achievements are free. We may add, change
        or remove games and features over time.
      </p>

      <h2>Your account</h2>
      <p>
        You need an account to sync your progress and appear on the leaderboard. You are responsible for what is done with it. You
        must be at least 13 years old.
      </p>

      <h2>Craneá Plus</h2>
      <ul>
        <li>Plus is a monthly or yearly subscription that unlocks every level, the daily archive, unlimited hints and an ad-free app.</li>
        <li>It is purchased on Google Play or the App Store. You'll see the final price, in your currency, in the store before you confirm.</li>
        <li>It renews automatically at the end of each period unless you cancel it from the store at least 24 hours before. If you cancel, you keep Plus until the paid period ends.</li>
        <li>Refunds are handled by the store according to its policies.</li>
        <li>Plus is tied to your Craneá account and also turns on on the website with the same account.</li>
      </ul>

      <h2>Fair play</h2>
      <p>
        The leaderboard is for playing for real. If we detect cheating (for example, tampering with results or automating games), we
        may remove results from the leaderboard or suspend the account.
      </p>

      <h2>Content</h2>
      <p>
        Craneá's games, boards, texts, design and brand belong to their owner. You can share your results, but you may not copy or
        redistribute the content.
      </p>

      <h2>Liability</h2>
      <p>
        Craneá is provided as is. We do our best to keep it working well, but we don't guarantee that it will always be available or
        free of errors. To the extent permitted by law, we are not liable for indirect damages arising from its use. Nothing here
        limits your rights as a consumer under Argentine Consumer Protection Law No. 24,240.
      </p>

      <h2>Changes and governing law</h2>
      <p>
        If we change these terms, we'll update the date above. These terms are governed by the laws of the Argentine Republic. For
        questions or complaints, write to us at <a href={`mailto:${LEGAL.email}`} className="underline underline-offset-4">{LEGAL.email}</a>.
      </p>
    </LegalPage>
  );
}
