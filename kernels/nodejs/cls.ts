import cls from "cls-hooked";

const clsStore = cls.createNamespace("sparkles");

export function getCurrentExecutionId() {
  return clsStore.get("executionId");
}

export function setCurrentExecutionId(executionId: string | null) {
  return clsStore.set("executionId", executionId);
}

export function runHooked<T>(executionId: string, fn: () => Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    clsStore.run(async () => {
      setCurrentExecutionId(executionId);
      try {
        resolve(await fn());
      } catch (error) {
        reject(error);
      }
    });
  });
}
