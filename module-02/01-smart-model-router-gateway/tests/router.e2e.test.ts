import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.ts";
import { config } from "../src/config.ts";
import {
  type LLMResponse,
  OpenRouterService,
} from "../src/openrouterService.ts";

console.assert(
  process.env.OPENROUTER_API_KEY,
  "OPENROUTER_API_KEY environment variable is not set",
);

test("routes to cheapest model by default", async () => {
  const customConfig = {
    ...config,
    provider: {
      ...config.provider,
      sort: {
        ...config.provider.sort,
        by: "price",
      },
    },
  };

  const routerService = new OpenRouterService(customConfig);
  const app = createServer(routerService);

  const response = await app.inject({
    method: "POST",
    url: "/chat",
    body: { question: "What is the capital of France?" },
  });

  assert.equal(response.statusCode, 200);

  const jsonResponse = response.json() as LLMResponse;

  assert.equal(jsonResponse.model, "inclusionai/ring-2.6-1t-20260508:free");
});

test("routes to highest throughput model by default", async () => {
  const customConfig = {
    ...config,
    provider: {
      ...config.provider,
      sort: {
        ...config.provider.sort,
        by: "throughput",
      },
    },
  };

  const routerService = new OpenRouterService(customConfig);
  const app = createServer(routerService);

  const response = await app.inject({
    method: "POST",
    url: "/chat",
    body: { question: "What is the capital of France?" },
  });

  assert.equal(response.statusCode, 200);

  const jsonResponse = response.json() as LLMResponse;

  assert.equal(jsonResponse.model, "nvidia/nemotron-3-nano-30b-a3b");
});
