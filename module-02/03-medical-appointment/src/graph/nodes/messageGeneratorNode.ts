import {
  getSystemPrompt,
  getUserPromptTemplate,
  MessageSchema,
} from "../../prompts/v1/messageGenerator.ts";
import { type OpenRouterService } from "../../services/openRouterService.ts";
import type { GraphState } from "../graph.ts";
import { AIMessage } from "langchain";

export function createMessageGeneratorNode(llmClient: OpenRouterService) {
  return async (state: GraphState): Promise<GraphState> => {
    console.log(`💬 Generating response message...`);

    try {
      const hasSucceeded = state.actionSuccess ? "success" : "error";
      const scenario = `${state.intent ?? "unknown"}_${hasSucceeded}`;
      const details = {
        professionalName: state.professionalName,
        datetime: state.datetime,
        patientName: state.patientName,
        error: state.actionError || state.error,
      };
      const systemPrompt = getSystemPrompt();
      const userPrompt = getUserPromptTemplate({ scenario, details });

      const response = await llmClient.generateStructured(
        systemPrompt,
        userPrompt,
        MessageSchema,
      );
      console.log(
        `✅ Message generated: ${response.data?.message ?? response.data ?? response}`,
      );

      if (response.error) {
        console.error(`❌ Error from LLM client: ${response.error}`);
        return {
          messages: [
            ...state.messages,
            new AIMessage(
              "Desculpe, ocorreu um erro ao gerar a mensagem. Por favor, tente novamente.",
            ),
          ],
        };
      }

      return {
        messages: [...state.messages, new AIMessage(response.data!.message)],
      };
    } catch (error) {
      console.error("❌ Error in messageGenerator node:", error);
      return {
        messages: [
          ...state.messages,
          new AIMessage(
            "Desculpe, ocorreu um erro ao gerar a mensagem. Por favor, tente novamente.",
          ),
        ],
      };
    }
  };
}
