import type { CustomerMutation, Customer, CustomerUpdate } from "../domain/customer.ts";

export class CustomerHttpClient {
  private baseUrl: string;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async listCustomers(): Promise<Customer[]> {
    const res = await fetch(`${this.baseUrl}/customers`);
    return res.json() as Promise<Customer[]>;
  }

  async createCustomer(customer: Omit<Customer, "_id">) {
    const res = await fetch(`${this.baseUrl}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    });
    return res.json() as Promise<CustomerMutation>;
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const res = await fetch(`${this.baseUrl}/customers/${id}`);
    if (res.status === 404) return null;
    return res.json() as Promise<Customer>;
  }

  async updateCustomer(customer: CustomerUpdate): Promise<CustomerMutation> {
    const res = await fetch(`${this.baseUrl}/customers/${customer._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: customer.name, phone: customer.phone }),
    });
    return res.json() as Promise<CustomerMutation>;
  }

  async deleteCustomer(id: string): Promise<CustomerMutation> {
    const res = await fetch(`${this.baseUrl}/customers/${id}`, {
      method: "DELETE",
    });
    return res.json() as Promise<CustomerMutation>;
  }
}
