import path from "path";
import dotenv from "dotenv";
import uWebSockets from "uWebSockets.js";
import { TextDecoder } from "util";
import { configureTodos, subscribe } from "./broker";
import { getSubFromJwt } from "./utils";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

interface Command<D = unknown> {
  name: string;
  data: D;
}

interface SubscribeData {
  topic: string;
  token: string;
}

const PORT = process.env.WSS_PORT || 80;

const run = (): void => {
  const app =
    process.env.WSS_SSL_KEY && process.env.WSS_SSL_CERT
      ? uWebSockets.SSLApp({
          key_file_name: process.env.WSS_SSL_KEY,
          cert_file_name: process.env.WSS_SSL_CERT,
        })
      : uWebSockets.App();

  if (process.env.WSS_REDIS_URL.endsWith(".dev")) {
    configureTodos(app);
  }

  subscribe(app);

  app
    .ws("/*", {
      open(ws) {
        ws.subscribe("broadcast");
      },
      async message(ws, message) {
        try {
          const command: Command<SubscribeData> = JSON.parse(
            new TextDecoder().decode(message)
          );

          const userId = await getSubFromJwt(command.data.token);

          switch (command.name) {
            case "subscribe":
              ws.subscribe(`${userId}/${command.data.topic}`);
              break;

            case "unsubscribe":
              ws.unsubscribe(`${userId}/${command.data.topic}`);
              break;

            default:
              throw new Error(`Unrecognized command ${command.name}`);
          }
        } catch (error) {
          ws.send(`wss: ${error}`);
          console.debug(error);
        }
      },
    })
    .get("/num_subscribers", (res) => {
      res.writeStatus("200 OK").end(app.numSubscribers("broadcast").toString());
    })
    .get("/*", (res) => {
      res.writeStatus("204 No Content").end();
    })
    .listen("0.0.0.0", PORT, (listenSocket) => {
      if (listenSocket) {
        console.debug(`Listening to port ${PORT}`);
      } else {
        console.error(`Failed to listen ${PORT}`);
      }
    });
};

export default run;

if (process.env.WSS_REDIS_URL.endsWith(".dev")) {
  run();
}
