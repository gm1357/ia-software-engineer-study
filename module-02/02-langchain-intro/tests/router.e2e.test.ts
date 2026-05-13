import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.ts";

console.assert(
  process.env.OPENROUTER_API_KEY,
  "OPENROUTER_API_KEY environment variable is not set",
);

test("command upper transforms message into uppercase", async () => {
  const app = createServer();
  const msg = "Make this uppercase";
  const expected = msg.toUpperCase();

  const response = await app.inject({
    method: "POST",
    url: "/chat",
    body: { question: msg },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body, expected);
});

test("command lower transforms message into lowercase", async () => {
  const app = createServer();
  const msg = "MAKE This Lowercase";
  const expected = msg.toLowerCase();

  const response = await app.inject({
    method: "POST",
    url: "/chat",
    body: { question: msg },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body, expected);
});

test("unknown command returns original message", async () => {
  const app = createServer();
  const msg = "How are you?";
  const expected =
    "Unknown command. Try 'make this uppercase' or 'convert to lowercase'.";

  const response = await app.inject({
    method: "POST",
    url: "/chat",
    body: { question: msg },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body, expected);
});
