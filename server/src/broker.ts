import { TemplatedApp } from "uWebSockets.js";
import redis from "redis";
import { getSubFromJwt, readJson } from "./utils";

export function subscribe(app: TemplatedApp): void {
  const subscriber = redis.createClient(process.env.WSS_REDIS_URL);

  subscriber.on("message", (_, message) => {
    const { topic, userId } = JSON.parse(message);
    app.publish(userId ? `${userId}/${topic}` : "broadcast", message);
  });

  subscriber.subscribe(process.env.WSS_REDIS_CHANNEL);
}

export function configureTodos(app: TemplatedApp): void {
  const publisher = redis.createClient(process.env.WSS_REDIS_URL);

  app.post("/todos", async (res, req) => {
    const userId = await getSubFromJwt(req.getQuery().replace("token=", ""));

    readJson(
      res,
      ({ todo: data }: { todo: string }) => {
        publisher.publish(
          process.env.WSS_REDIS_CHANNEL,
          JSON.stringify({ topic: "todos", data, userId })
        );

        res.writeStatus("204 No Content").end();
      },
      () => {
        console.log("Invalid JSON or no data at all!");
      }
    );
  });
}
