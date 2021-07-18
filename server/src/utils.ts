import { HttpResponse } from "uWebSockets.js";
import { jwtVerify } from "jose/jwt/verify";
import { decodeProtectedHeader } from "jose/util/decode_protected_header";
import { createPublicKey } from "crypto";

export function readJson<D = unknown>(
  res: HttpResponse,
  cb: (json: D) => void,
  err: () => void
): void {
  let buffer: Uint8Array | Buffer;
  /* Register data cb */
  res.onData((ab: ArrayBuffer, isLast: boolean) => {
    const chunk = Buffer.from(ab);
    if (isLast) {
      let json;
      if (buffer) {
        try {
          json = JSON.parse(Buffer.concat([buffer, chunk]).toString());
        } catch (e) {
          /* res.close calls onAborted */
          res.close();
          return;
        }
        cb(json);
      } else {
        try {
          json = JSON.parse(chunk.toString());
        } catch (e) {
          /* res.close calls onAborted */
          res.close();
          return;
        }
        cb(json);
      }
    } else {
      if (buffer) {
        buffer = Buffer.concat([buffer, chunk]);
      } else {
        buffer = Buffer.concat([chunk]);
      }
    }
  });

  /* Register error cb */
  res.onAborted(err);
}

export async function getSubFromJwt(
  token: string
): Promise<string | undefined> {
  const header = decodeProtectedHeader(token);

  if (!header.alg) {
    throw new Error("Invalid jwt alg");
  }

  const { payload } = await jwtVerify(
    token,
    createPublicKey(
      "-----BEGIN PUBLIC KEY-----\n" +
        process.env.WSS_KEYCLOAK_PK +
        "\n-----END PUBLIC KEY-----"
    ),
    {
      algorithms: [header.alg],
    }
  );

  return payload.sub;
}
