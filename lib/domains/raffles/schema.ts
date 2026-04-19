import { z } from "zod";

export const raffleEligibilitySchema = z.object({
  min_level: z.enum(["bronze", "silver", "gold", "diamond"]).default("silver"),
});

export const createRaffleSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(240).default(""),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  prize_name: z.string().trim().min(3).max(120),
  prize_description: z.string().trim().max(240).default(""),
  min_level: z.enum(["bronze", "silver", "gold", "diamond"]).default("silver"),
  status: z.enum(["draft", "open"]).default("open"),
});

export type CreateRaffleInput = z.infer<typeof createRaffleSchema>;

export function buildRafflePayload(values: CreateRaffleInput) {
  return {
    name: values.name,
    description: values.description || null,
    starts_at: values.starts_at,
    ends_at: values.ends_at,
    prize_name: values.prize_name,
    prize_description: values.prize_description || null,
    status: values.status,
    eligibility: raffleEligibilitySchema.parse({
      min_level: values.min_level,
    }),
  };
}
