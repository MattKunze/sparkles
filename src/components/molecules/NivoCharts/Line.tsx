import { Datum, DatumValue, ResponsiveLine, Serie } from "@nivo/line";
import { useMemo } from "react";

type Props = {
  raw: Record<string, unknown>[];
};

export function Line({ raw }: Props) {
  const data = useMemo((): Serie[] => {
    const [axis, ...keys] = Object.keys(raw[0]);

    return keys.map<Serie>((key) => ({
      id: key,
      data: raw.map(createDatum.bind(null, axis, key)),
    }));
  }, [raw]);

  return (
    <div className="w-full h-96">
      <ResponsiveLine
        data={data}
        margin={{ top: 0, right: 110, bottom: 50, left: 60 }}
        pointSize={10}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointLabelYOffset={-12}
        useMesh={true}
        legends={[
          {
            anchor: "bottom-right",
            direction: "column",
            justify: false,
            translateX: 100,
            translateY: 0,
            itemsSpacing: 0,
            itemDirection: "left-to-right",
            itemWidth: 80,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: "circle",
            symbolBorderColor: "rgba(0, 0, 0, .5)",
            effects: [
              {
                on: "hover",
                style: {
                  itemBackground: "rgba(0, 0, 0, .03)",
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
        axisBottom={{
          tickRotation: data.length >= 10 ? -90 : 0,
        }}
      />
    </div>
  );
}

function createDatum(
  axis: string,
  key: string,
  d: Record<string, unknown>
): Datum {
  const x = d[axis] as DatumValue;
  const y = d[key] as DatumValue;
  return { x, y };
}
