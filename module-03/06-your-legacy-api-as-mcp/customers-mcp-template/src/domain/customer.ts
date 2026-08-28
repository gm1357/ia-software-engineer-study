import z from "zod";

export const CustomerSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  phone: z.string(),
});

export type Customer = z.infer<typeof CustomerSchema>;

export const CustomerQuerySchema = z.object({
  _id: z.string().optional().describe("MongoDB ObjectId of the customer"),
  name: z.string().optional().describe("Full name of the customer"),
  phone: z.string().optional().describe("Phone number of the customer"),
});

export type CustomerQuery = z.infer<typeof CustomerQuerySchema>;

export const CustomerUpdateSchema = CustomerQuerySchema.extend({
  _id: z.string().describe("MongoDB ObjectId of the customer"),
});

export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>;

export const CustomerDeleteSchema = z.object({
  _id: z.string().describe("MongoDB ObjectId of the customer"),
});

export type CustomerDelete = z.infer<typeof CustomerDeleteSchema>;

export const CustomerMutationSchema = z.object({
  id: z.string().optional().describe("MongoDB ObjectId of the customer"),
  message: z.string().optional().describe("Message indicating the result of the mutation"),
  isError: z.boolean().optional().describe("Indicates if the mutation resulted in an error"),
});

export type CustomerMutation = z.infer<typeof CustomerMutationSchema>;