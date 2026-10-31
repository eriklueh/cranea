import {
  CalendarCheckIcon, CrownIcon, EyeIcon, FlagIcon, FlameIcon, InfinityIcon, MapIcon, MedalIcon, MoonIcon, PaletteIcon,
  PuzzleIcon, SparklesIcon, SplineIcon, StarIcon, SunriseIcon, TargetIcon, TowerControlIcon, TrophyIcon, ZapIcon, type LucideIcon,
} from "lucide-react";
import type { AchievementIcon as IconName } from "@cranea/core/achievements";

const ICONS: Record<IconName, LucideIcon> = {
  calendar: CalendarCheckIcon,
  flag: FlagIcon,
  flame: FlameIcon,
  crown: CrownIcon,
  sunrise: SunriseIcon,
  moon: MoonIcon,
  zap: ZapIcon,
  target: TargetIcon,
  sparkles: SparklesIcon,
  eye: EyeIcon,
  bridge: SplineIcon,
  palette: PaletteIcon,
  building: TowerControlIcon,
  puzzle: PuzzleIcon,
  map: MapIcon,
  star: StarIcon,
  trophy: TrophyIcon,
  medal: MedalIcon,
  infinity: InfinityIcon,
};

export function AchievementIcon({ icon, className }: { icon: IconName; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon aria-hidden className={className} />;
}
