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