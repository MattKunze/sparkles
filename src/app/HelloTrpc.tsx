"use client";

import { trpc } from "@/utils/trpcClient";

export default function HelloTrcp() {
  const hello = trpc.hello.useQuery({ text: "client" });
  if (!hello.data) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <p>
        {hello.data.greeting} @ {hello.data.timestamp.toISOString()}
      </p>
    </div>
  );
}
