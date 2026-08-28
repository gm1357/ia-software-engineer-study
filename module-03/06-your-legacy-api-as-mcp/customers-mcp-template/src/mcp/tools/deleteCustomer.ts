import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CustomerService } from "../../application/customerService.ts";
import { CustomerMutationSchema, CustomerDeleteSchema } from "../../domain/customer.ts";

export function registerDeleteCustomersTool(
  server: McpServer,
  service: CustomerService,
) {
  server.registerTool(
    "delete_customer",
    {
      description: "Delete an existing customer by their _id",
      inputSchema: CustomerDeleteSchema.shape,
      outputSchema: CustomerMutationSchema.shape,
    },
    async ({ _id }) => {
      try {
        const deleteResponse = await service.deleteCustomer(_id);
        return {
          content: [
            {
              type: "text",
              text: deleteResponse.message ?? "",
            },
          ],
          structuredContent: deleteResponse,
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to delete customer. Error details: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}
