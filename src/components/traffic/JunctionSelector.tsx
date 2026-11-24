import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

import { JUNCTION_IDS, JUNCTIONS, type JunctionId } from "@/lib/sim/junctions";
import { pick } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type JunctionFilter = JunctionId | "all";

export function JunctionSelector({
  value,
  onChange,
}: {
  value: JunctionFilter;
  onChange: (v: JunctionFilter) => void;
}) {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
          value === "all"
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-muted/40 border-border hover:bg-muted text-foreground",
        )}
      >
        {t("junctionSelector.all")}
      </button>
      {JUNCTION_IDS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-1.5",
            value === id
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-muted/40 border-border hover:bg-muted text-foreground",
          )}
        >
          <MapPin className="size-3" />
          {pick(JUNCTIONS[id].name, i18n.language)}
        </button>
      ))}
    </div>
  );
}
