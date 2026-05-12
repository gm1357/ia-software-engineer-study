console.assert(
  process.env.OPENROUTER_API_KEY,
  "OPENROUTER_API_KEY environment variable is not set",
);

export type Config = {
  apiKey: string;
  httpReferer: string;
  xTitle: string;
  port: number;
  models: string[];
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  provider: {
    sort: {
      by: string;
      partition: string;
    };
  };
};

export const config: Config = {
  apiKey: process.env.OPENROUTER_API_KEY!,
  httpReferer: "http://localhost:3000",
  xTitle: "SmartModelRouterGateway",
  port: 3000,
  models: [
    "inclusionai/ring-2.6-1t-20260508:free",
    "nvidia/nemotron-3-nano-30b-a3b",
  ],
  temperature: 0.2,
  maxTokens: 100,
  systemPrompt: "You are a helpful assistant.",
  provider: {
    sort: {
      by: "throughput",
      partition: "none",
    },
  },
};
