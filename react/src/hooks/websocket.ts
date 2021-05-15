import {
  createContext,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import { useKeycloak } from "@react-keycloak/web";

interface CustomEvent<D = unknown> extends Event {
  detail?: D;
}

export interface WebSocketContextOptions {
  client?: WebSocket;
  retry: number;
  opened: boolean;
}

export const Context = createContext<WebSocketContextOptions>({
  retry: 0,
  opened: false,
});

export const useWebSocket = (): WebSocketContextOptions => {
  return useContext(Context);
};

export const useSubscribe = <D = unknown>(
  topic: string,
  listener: (data: D) => void
): void => {
  const { keycloak } = useKeycloak();
  const ws = useWebSocket();
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  const fn = useCallback(async (event: CustomEvent<D>) => {
    if (event.detail) {
      await listenerRef.current(event.detail);
    }
  }, []);

  useEffect(() => {
    const type = `ws:${topic}`;

    document.removeEventListener(type, fn);
    document.addEventListener(type, fn);

    return () => {
      document.removeEventListener(type, fn);
    };
  }, [fn]);

  useEffect(() => {
    if (ws.client?.readyState !== WebSocket.OPEN || !keycloak.token) {
      return;
    }

    const data = JSON.stringify({
      name: "subscribe",
      data: { topic, token: keycloak.token },
    });

    ws.client?.send(data);

    return () => {
      const data = JSON.stringify({
        name: "unsubscribe",
        data: { topic, token: keycloak.token },
      });

      if (ws.client?.readyState === WebSocket.OPEN && keycloak.token) {
        ws.client?.send(data);
      }
    };
  }, [ws.client]);
};
