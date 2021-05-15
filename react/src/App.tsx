import { WebSocketProvider, useSubscribe } from "lib";
import React, { FormEvent, useState } from "react";
import Keycloak from "keycloak-js";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import { QueryClientProvider, QueryClient, useMutation } from "react-query";

const keycloak = Keycloak({
  url: "https://sso.timada.dev:3000/auth",
  realm: "timada-dev",
  clientId: "wss",
});

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{ onLoad: "login-required" }}
      LoadingComponent={<></>}
    >
      <WebSocketProvider url="wss://wss.timada.dev:3001">
        <QueryClientProvider client={queryClient}>
          <Container />
        </QueryClientProvider>
      </WebSocketProvider>
    </ReactKeycloakProvider>
  );
};

const Container: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [todos, setTodos] = useState<string[]>([]);

  const mutation = useMutation(async (todo: string) =>
    fetch(`https://wss.timada.dev:3001/todos?token=${keycloak.token}`, {
      mode: "no-cors",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ todo }),
    })
  );

  useSubscribe("todos", (data: string) => {
    setTodos((e) => [...e, data]);
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    mutation.mutate(inputValue);

    setInputValue("");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ul>
        <form onSubmit={onSubmit}>
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add todo"
          />
        </form>
        {todos.map((todo, i) => (
          <li key={i}>{todo}</li>
        ))}
      </ul>
    </QueryClientProvider>
  );
};

export default App;
