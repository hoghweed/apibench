import { z } from "zod";

export const ErrorSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  details: z.string().optional(),
  stack: z.string().optional(),
  message: z.string(),
});

export const User = z.object({
  id: z.string(),
  name: z.string().min(5),
  email: z.email(),
  password: z.string().min(8), // This would be hashed in practice
  createdAt: z.date(),
  updatedAt: z.date(),
  username: z.string().min(3).optional(),
  isActive: z.boolean().default(true),
});

export const UserList = z.array(User.omit({ password: true }));

export const Direction = {
  ASC: "asc",
  DESC: "desc",
} as const;

export const QuerySchema = z.object({
  created: z.enum(Direction),
});

export type Direction = (typeof Direction)[keyof typeof Direction];
export type QueryType = z.infer<typeof QuerySchema>;
export type UserType = z.infer<typeof User>;
export type UserListType = z.infer<typeof UserList>;
