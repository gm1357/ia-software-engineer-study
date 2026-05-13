import { AIMessage } from "langchain";
import { type GraphState } from "../graph.ts";

export function fallback(state: GraphState): GraphState {
  const message =
    "Unknown command. Try 'make this uppercase' or 'convert to lowercase'.";

  return {
    ...state,
    output: message,
  };
}
