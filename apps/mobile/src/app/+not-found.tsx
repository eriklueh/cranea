import { NotFound } from "@/components/not-found";
import { useT } from "@/lib/i18n";

export default function Missing() {
  const t = useT();
  return <NotFound title={t("shell.notFoundScreen")} />;
}
