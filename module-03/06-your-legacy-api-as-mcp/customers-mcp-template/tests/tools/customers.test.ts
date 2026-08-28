import { describe, it, after, before } from "node:test";
import assert from "node:assert";
import { createTestClient } from "../helpers.ts";
import { Client } from "@modelcontextprotocol/sdk/client";
import type { CustomerMutation, Customer } from "../../src/domain/customer.ts";

type CustomersResult = { structuredContent: { customers: Customer[] } };
type CustomerResult = { structuredContent: { customer: Customer } };
type CustomerMutationResult = {
  structuredContent: CustomerMutation;
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
    })) as unknown as CustomerMutationResult;

    assert.ok(result.structuredContent.id, "should contain id");

    assert.deepStrictEqual(
      result.structuredContent.message,
      `user ${customer.name} created!`,
    );
  });

  it("should update a customer", async () => {
    const createCustomer = {
      name: "John",
      phone: "12345-6789",
    };
    const createResult = (await client.callTool({
      name: "create_customer",
      arguments: createCustomer,
    })) as unknown as CustomerMutationResult;

    const updateCustomer = {
      _id: createResult.structuredContent.id,
      name: "Jane",
      phone: "12345-6789",
    };
    const updateResult = (await client.callTool({
      name: "update_customer",
      arguments: updateCustomer,
    })) as unknown as CustomerMutationResult;

    assert.ok(updateResult.structuredContent.message, "should contain message");

    assert.deepStrictEqual(
      updateResult.structuredContent.id,
      createResult.structuredContent.id,
    );
  });

  it("should delete a customer", async () => {
    const createCustomer = {
      name: "John",
      phone: "12345-6789",
    };
    const createResult = (await client.callTool({
      name: "create_customer",
      arguments: createCustomer,
    })) as unknown as CustomerMutationResult;

    const deleteCustomer = {
      _id: createResult.structuredContent.id,
    };
    const deleteResult = (await client.callTool({
      name: "delete_customer",
      arguments: deleteCustomer,
    })) as unknown as CustomerMutationResult;

    assert.ok(deleteResult.structuredContent.message, "should contain message");

    assert.deepStrictEqual(
      deleteResult.structuredContent.id,
      createResult.structuredContent.id,
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
    })) as unknown as CustomerMutationResult;

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
