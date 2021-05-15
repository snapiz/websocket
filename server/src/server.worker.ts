import { Worker, isMainThread } from "worker_threads";
import os from "os";
import run from "./server";

if (isMainThread) {
  os.cpus().forEach(() => {
    /* Spawn a new thread running this source file */
    new Worker(__filename);
  });
} else {
  run();
}
