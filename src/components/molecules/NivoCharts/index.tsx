import { Bar } from "./Bar";
import { Calendar } from "./Calendar";
import { Line } from "./Line";

export type ChartStyle = "line" | "bar" | "calendar";
type Props = {
  style: ChartStyle;
  data: Record<string, unknown>[];
};

export function NivoCharts({ style, data }: Props) {
  switch (style) {
    case "bar":
      return <Bar raw={data} />;
    case "line":
      return <Line raw={data} />;
    case "calendar":
      return <Calendar raw={data} />;
  }
}
