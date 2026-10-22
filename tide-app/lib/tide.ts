
const API_BASE_URL = "http://192.168.100.4:8000";

export type TideExtreme = {
  type: "HIGH" | "LOW";
  time: string;
  height: number;
};

type TideApiResponse = {
  location: {
    id: string;
    name: string;
    province: string;
    country: string;
  };
  date: string;
  timezone: string;
  events: {
    type: "HIGH" | "LOW";
    time: string;
    height_m: number;
  }[];
};

export type TideTimelinePoint = {
  time: string;
  height_m: number;
};

type TideTimelineResponse = {
  date: string;
  timeline: TideTimelinePoint[];
};

export function getManilaDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));

  return [
    result.getUTCFullYear(),
    String(result.getUTCMonth() + 1).padStart(2, "0"),
    String(result.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export async function fetchTodayTides(
  date: string = getManilaDate()
): Promise<TideExtreme[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/tides/hagonoy?date=${date}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tides: ${response.status}`);
  }

  const data: TideApiResponse = await response.json();

  return data.events.map((event) => ({
    type: event.type,
    time: event.time,
    height: event.height_m,
  }));
}

export async function fetchTodayTimeline(
  date: string = getManilaDate()
): Promise<TideTimelinePoint[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/tides/hagonoy/timeline?date=${date}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch tide timeline: ${response.status}`
    );
  }

  const data: TideTimelineResponse = await response.json();

  return data.timeline;
}

export function getCurrentPredictedLevel(
  timeline: TideTimelinePoint[],
  now: Date = new Date()
): number | null {
  const targetTime = now.getTime();

  const validPoints = timeline
    .map((point) => ({
      ...point,
      timestamp: new Date(point.time).getTime(),
    }))
    .filter((point) => Number.isFinite(point.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (validPoints.length === 0) {
    return null;
  }

  let closest = validPoints[0];
  let closestDifference = Math.abs(
    closest.timestamp - targetTime
  );

  for (const point of validPoints.slice(1)) {
    const difference = Math.abs(
      point.timestamp - targetTime
    );

    if (difference < closestDifference) {
      closest = point;
      closestDifference = difference;
    }
  }

  // Don't present an old or distant reading as the current level.
  if (closestDifference > 90 * 60 * 1000) {
    return null;
  }

  return closest.height_m;
}
