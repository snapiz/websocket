import React, { useEffect, useState, useRef } from "react";
import { Context } from "hooks/websocket";

export interface WebSocketProviderProps {
  url: string;
  onError?: (err: Event) => void;
}

interface Message<D = unknown> {
  topic: string;
  data: D;
}

const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url,
  onError,
}) => {
  const clientRef = useRef<WebSocket | undefined>();
  const onErrorRef = useRef<(err: Event) => void | undefined>();
  const [retry, setRetry] = useState(0);
  const [opened, setOpened] = useState(false);

  onErrorRef.current = onError;

  useEffect(() => {
    if (clientRef.current) {
      return;
    }

    const ws = new WebSocket(url);

    ws.onopen = () => {
      setOpened(true);
    };

    ws.onmessage = (event) => {
      try {
        const message: Message = JSON.parse(event.data);

        document.dispatchEvent(
          new CustomEvent(`ws:${message.topic}`, { detail: message.data })
        );
      } catch (error) {
        if (onErrorRef.current) {
          onErrorRef.current(error);
        }
      }
    };

    if (onError) {
      ws.onerror = onError;
    }

    ws.onclose = (ev) => {
      if (ev.wasClean) {
        return;
      }

      setOpened(false);

      clientRef.current = undefined;

      setTimeout(() => {
        setRetry((r) => ++r);
      }, Math.min(1000 + 200 * retry, 10000));
    };

    clientRef.current = ws;

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [retry, setRetry, setOpened]);

  return (
    <Context.Provider value={{ client: clientRef.current, retry, opened }}>
      {children}
    </Context.Provider>
  );
};

export default WebSocketProvider;
