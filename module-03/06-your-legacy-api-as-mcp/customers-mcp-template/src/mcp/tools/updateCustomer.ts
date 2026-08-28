import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CustomerService } from "../../application/customerService.ts";
import { CustomerMutationSchema, CustomerUpdateSchema } from "../../domain/customer.ts";

export function registerUpdateCustomersTool(
  server: McpServer,
  service: CustomerService,
) {
  server.registerTool(
    "update_customer",
    {
      description: "Update an existing customer's name and/or phone number by their _id",
      inputSchema: CustomerUpdateSchema.shape,
      outputSchema: CustomerMutationSchema.shape,
    },
    async (customer) => {
      try {
        const updateResponse = await service.updateCustomer(customer);
        return {
          content: [
            {
              type: "text",
              text: updateResponse.message ?? "",
            },
          ],
          structuredContent: updateResponse,
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to update customer. Error details: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  );
}
