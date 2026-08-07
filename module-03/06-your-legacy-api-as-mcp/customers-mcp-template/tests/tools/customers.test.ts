import { describe, it, after, before } from "node:test";
import assert from "node:assert";
import { createTestClient } from "../helpers.ts";
import { Client } from "@modelcontextprotocol/sdk/client";
import type { CreatedCustomer, Customer } from "../../src/domain/customer.ts";

type CustomersResult = { structuredContent: { customers: Customer[] } };
type CustomerResult = { structuredContent: { customer: Customer } };
type CreateCustomerResult = {
  structuredContent: CreatedCustomer;
};

describe("Customer MCP Suite", () => {
  let client: Client;
  before(async () => {
    client = await createTestClient();
  });

  after(async () => {
    await client.close();
  });

  it("should list all customers", async () => {
    const result = (await client.callTool({
      name: "list_customers",
      arguments: {},
    })) as unknown as CustomersResult;

    assert.ok(
      Array.isArray(result.structuredContent.customers),
      "should return an array of customers",
    );
  });

  it("should create a customer", async () => {
    const customer = {
      name: "John",
      phone: "12345-6789",
    };
    const result = (await client.callTool({
      name: "create_customer",
      arguments: customer,
    })) as unknown as CreateCustomerResult;

    assert.ok(result.structuredContent.id, "should contain id");

    assert.deepStrictEqual(
      result.structuredContent.message,
      `user ${customer.name} created!`,
    );
  });

  it("should get a customer by partial name", async () => {
    const customer = {
      name: "Jane",
      phone: "12343-6789",
    };
    (await client.callTool({
      name: "create_customer",
      arguments: customer,
    })) as unknown as CreateCustomerResult;

    const result = (await client.callTool({
      name: "get_customer",
      arguments: {
        name: "Jan",
      },
    })) as unknown as CustomerResult;

    assert.ok(result.structuredContent.customer._id, "should contain id");

    assert.deepStrictEqual(
      result.structuredContent.customer.name,
      customer.name,
    );
  });
});
