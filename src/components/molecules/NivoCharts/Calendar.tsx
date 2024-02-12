import {
  CalendarData,
  CalendarDatum,
  ResponsiveCalendar,
} from "@nivo/calendar";
import { useMemo, useState } from "react";

type Props = {
  raw: Record<string, unknown>[];
};

export function Calendar({ raw }: Props) {
  const [when, ...keys] = Object.keys(raw[0]);
  const [value, setValue] = useState(keys[0]);

  const { from, to, data } = useMemo((): CalendarData => {
    let min: string = "",
      max: string = "";
    const data = raw.map<CalendarDatum>((d) => {
      const datum = createDatum(when, value, d);
      if (!min || datum.day < min) min = datum.day;
      if (!max || datum.day > max) max = datum.day;
      return datum;
    });
    return {
      from: min,
      to: max,
      data,
    };
  }, [raw, when, value]);

  return (
    <div className="w-full h-96">
      <div className="dropdown m-2">
        <div tabIndex={0} role="button">
          Value: {value}
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
        >
          {keys.map((key) => (
            <li key={key}>
              <a
                onClick={() => {
                  setValue(key);
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                }}
              >
                {key}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <ResponsiveCalendar
        from={from}
        to={to}
        data={data}
        emptyColor="#eeeeee"
        colors={["#61cdbb", "#97e3d5", "#e8c1a0", "#f47560"]}
        margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
        yearSpacing={40}
        monthBorderColor="#ffffff"
        dayBorderWidth={2}
        dayBorderColor="#ffffff"
      />
    </div>
  );
}

function createDatum(
  when: string,
  value: string,
  d: Record<string, unknown>
): CalendarDatum {
  return {
    day: d[when] as string,
    value: d[value] as number,
  };
}
