import { useMemo } from "react";

export function useFormattedBuildTime(): string | null {
  return useMemo(() => {
    if (typeof __BUILD_TIME__ !== "string") {
      return null;
    }

    const date = new Date(__BUILD_TIME__);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    try {
      return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
    } catch {
      return date.toLocaleString("fr-FR");
    }
  }, []);
}

export function useBuildTimestampLabel(): string {
  const formatted = useFormattedBuildTime();
  return formatted
    ? `Dernière mise à jour : ${formatted}`
    : "Dernière mise à jour : horodatage indisponible";
}
