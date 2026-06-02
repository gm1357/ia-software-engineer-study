import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { getMongoDbTool } from "../tools/mongodbTool.ts";

export const getMCPTools = async () => {
  const client = new MultiServerMCPClient({
    mcpServers: {
      ...getMongoDbTool(),
    },
    onMessage: (log, source) => {
      console.log(`[${source.server}] ${log.data}`);
    },
  });

  const mcpTools = await client.getTools();

  return [...mcpTools];
};
