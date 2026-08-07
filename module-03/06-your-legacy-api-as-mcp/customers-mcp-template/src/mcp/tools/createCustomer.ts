import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CustomerService } from "../../application/cutomerService.ts";
import z from "zod";

export function registerCreateCustomersTool(
  server: McpServer,
  service: CustomerService,
) {
  server.registerTool(
    "create_customer",
    {
      description: "Create a customer",
      inputSchema: {
        name: z.string().describe("Full name of the customer"),
        phone: z.string().describe("Phone number of the customer"),
      },
      outputSchema: {
        id: z.string().describe("MongoDB ObjectId of the created customer"),
        message: z.string().describe("Confirmation message"),
      },
    },
    async ({ name, phone }) => {
      try {
        const createResponse = await service.createCustomer({ name, phone });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(createResponse, null, 2),
            },
          ],
          structuredContent: createResponse,
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to create customer. Error details: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}
