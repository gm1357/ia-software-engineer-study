import type { Customer } from "../domain/customer.ts";
import { CustomerHttpClient } from "../infrastructure/CustomerHttpClient.ts";

export class CustomerService {
  private readonly client: CustomerHttpClient;
  constructor(baseUrl: string) {
    this.client = new CustomerHttpClient(baseUrl);
  }

  async listCustomers(): Promise<Customer[]> {
    return this.client.listCustomers();
  }

  async createCustomer(customer: Omit<Customer, "_id">) {
    return this.client.createCustomer(customer);
  }
}
