import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const accountSchema = z.object({
  id: z.string(),
  createdAt: z.date().optional().nullable(),
  name: z.string().nullable(),
  email: z.string().nullable().optional(),
  assigned_to_user: z.object({}).optional().nullable(),
  contacts: z.array(z.any()).optional().nullable(),
});

export type Account = z.infer<typeof accountSchema>;
