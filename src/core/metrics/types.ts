export type Metric = {
  id: string;
  life_area_id: string | null;
  name: string;
  unit: string | null;
  value_type: "number" | "duration" | "currency" | "percent" | "rating" | "boolean";
  aggregation: "sum" | "avg" | "last" | "count" | "min" | "max";
  direction: "up" | "down" | "neutral";
  source: "manual" | "derived";
  derived_key: string | null;
  period: "day" | "week" | "month" | "quarter" | "year" | null;
  is_archived: boolean;
};

export type MetricPoint = { period_start: string; value: number };

export type MetricEntry = { id: string; value: number; recorded_at: string; note: string | null };
