// hooks/useCustomEvent.ts
import { useEffect } from "react";

type EventPayload = {
  message: string;
  eventType: string;
  value: any;
};

type EventHandler<T = EventPayload> = (payload: T) => void;

export const useCustomEvent = <T extends object = EventPayload>(
  eventName: string,
  handler?: EventHandler<T>
) => {
  const emit = (payload: T) => {
    const event = new CustomEvent<T>(eventName, { detail: payload });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    if (!handler) return;

    const listener = (e: Event) => {
      const customEvent = e as CustomEvent<T>;
      handler(customEvent.detail);
    };

    window.addEventListener(eventName, listener);
    return () => window.removeEventListener(eventName, listener);
  }, [eventName, handler]);

  return { emit };
};
