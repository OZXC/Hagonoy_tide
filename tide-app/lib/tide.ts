const API_BASE_URL = "http://192.168.100.4:8000"; // use YOUR IP from step 1

export type TideExtreme = {
  time: string;
  type: "high" | "low";
  height: number;
};

type BackendTideEvent = {
  type: "HIGH" | "LOW";
  time: string;
  height_m: number;
};

type BackendResponse = {
  date: string;
  events: BackendTideEvent[];
};

function toTideExtreme(dateStr: string, event: BackendTideEvent): TideExtreme {
  return {
    time: `${dateStr}T${event.time}:00`,
    type: event.type === "HIGH" ? "high" : "low",
    height: event.height_m,
  };
}

export async function fetchTodayTides(): Promise<TideExtreme[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/tides/hagonoy/today`);
  if (!response.ok) {
    throw new Error("Failed to fetch tide data from backend");
  }
  const data: BackendResponse = await response.json();
  return data.events.map((e) => toTideExtreme(data.date, e));
}

export function getCurrentNormalizedHeight(extremes: TideExtreme[]): number {
  if (extremes.length === 0) return 0.5;

  const sorted = [...extremes].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  const heights = sorted.map((e) => e.height);
  const min = Math.min(...heights);
  const max = Math.max(...heights);
  const range = max - min || 1;

  const now = Date.now();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (now <= new Date(first.time).getTime()) return (first.height - min) / range;
  if (now >= new Date(last.time).getTime()) return (last.height - min) / range;

  for (let i = 0; i < sorted.length - 1; i++) {
    const t0 = new Date(sorted[i].time).getTime();
    const t1 = new Date(sorted[i + 1].time).getTime();
    if (now >= t0 && now <= t1) {
      const frac = (now - t0) / (t1 - t0);
      const eased = (1 - Math.cos(frac * Math.PI)) / 2;
      const h = sorted[i].height + (sorted[i + 1].height - sorted[i].height) * eased;
      return (h - min) / range;
    }
  }
  return 0.5;
}