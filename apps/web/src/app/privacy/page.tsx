import type { Metadata } from "next";
import { LEGAL, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What data Craneá uses, what for, and how to ask for it to be deleted.",
  alternates: { languages: { es: "/privacidad" } },
};

/** English version of /privacidad. Keep both in sync. */
export default function PrivacyEn() {
  const mail = <a href={`mailto:${LEGAL.email}`} className="underline underline-offset-4">{LEGAL.email}</a>;
  return (
    <LegalPage title="Privacy policy" lang="en" page="privacy">
      <p>
        Craneá (the website cranea.app and the app for Android and iOS) is a logic puzzle service run by {LEGAL.owner}, based
        in {LEGAL.country}. This policy explains what data we use, what we use it for and what you can do about it. If you have
        any questions, write to us at {mail}.
      </p>

      <h2>Playing without an account</h2>
      <p>
        You can play without signing up. In that case your progress (results, streaks, achievements and settings) is stored only
        on your device and never reaches us.
      </p>

      <h2>What data we use if you create an account</h2>
      <ul>
        <li><strong>Account data:</strong> first name, last name (optional) and email, or whatever Google or Apple share if you sign in with them.</li>
        <li><strong>Game progress:</strong> level and daily puzzle results, attempts, times, streaks and achievements, to sync them across your devices.</li>
        <li><strong>Leaderboard:</strong> if you appear on the leaderboard, we show your first name with your last initial (for example, “Erik E.”) and your results. You can hide yourself at any time.</li>
        <li><strong>Subscription:</strong> if you have Craneá Plus, the status and expiration of your subscription. Payments are processed by Google Play or the App Store; we never see your card details.</li>
        <li><strong>Reminders:</strong> if you turn on the daily reminder, your browser or device notification subscription, your time zone and the time you chose.</li>
      </ul>

      <h2>Ads in the app</h2>
      <p>
        The free app may show rewarded ads only when you ask for them (for a hint or an extra try). They are served by Google
        AdMob, which may use your device's advertising identifier, IP address and technical data to show the ad, measure it and
        prevent fraud. We request non-personalized ads. There are no ads with Craneá Plus. The website shows no ads.
      </p>

      <h2>Who we share data with</h2>
      <p>Only with providers we need to make Craneá work, who process it on our behalf:</p>
      <ul>
        <li>Clerk (sign-in and accounts).</li>
        <li>Convex (database for progress, the leaderboard and subscriptions).</li>
        <li>Vercel (website hosting).</li>
        <li>RevenueCat, Google Play and the App Store (purchases and subscriptions).</li>
        <li>Google AdMob (rewarded ads in the app).</li>
        <li>Browser or operating system notification services (for the reminder).</li>
      </ul>
      <p>
        Some of these providers process data outside {LEGAL.country}, with appropriate safeguards. We don't sell your data or use
        it for our own advertising.
      </p>

      <h2>How long we keep it</h2>
      <p>
        For as long as you have your account. If you delete it, we erase your data within a reasonable time, except for anything we
        are legally required to keep (for example, purchase records kept by the stores).
      </p>

      <h2 id="delete-account">Your rights and how to delete your account</h2>
      <p>
        You can ask to access, correct or delete your data, or object to its use, by writing to {mail}. You can delete your account
        from the app (Account → Delete my account), from the website (Settings → Delete my account) or by asking us by email: this
        deletes the account and all its data in Craneá (saved progress, leaderboard entries, achievements and gifted Plus). In{" "}
        {LEGAL.country}, Personal Data Protection Law No. 25,326 applies; the Agency for Access to Public Information is the
        supervisory authority and handles complaints about violations.
      </p>

      <h2>Children</h2>
      <p>Craneá is not directed at children under 13, and we don't knowingly collect data from them.</p>

      <h2>Changes</h2>
      <p>If we change this policy, we'll update the date above and, if the change is significant, let you know in the app.</p>
    </LegalPage>
  );
}
