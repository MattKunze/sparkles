import { BarDatum, ResponsiveBar } from "@nivo/bar";

type Props = {
  raw: Record<string, unknown>[];
};

export function Bar({ raw }: Props) {
  const [axis, ...keys] = Object.keys(raw[0]);

  return (
    <div className="w-full h-96">
      <ResponsiveBar
        data={raw as BarDatum[]}
        indexBy={axis}
        keys={keys}
        valueFormat=""
        margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
        padding={0.3}
        legends={[
          {
            dataFrom: "keys",
            anchor: "bottom-right",
            direction: "column",
            justify: false,
            translateX: 120,
            translateY: 0,
            itemsSpacing: 2,
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: "left-to-right",
            itemOpacity: 0.85,
            symbolSize: 20,
            effects: [
              {
                on: "hover",
                style: {
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
        axisBottom={{
          tickRotation: raw.length >= 10 ? -90 : 0,
        }}
      />
    </div>
  );
}
