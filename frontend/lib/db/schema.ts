import { InferSelectModel } from "drizzle-orm";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";


export const user = pgTable('User', {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    email: varchar('email', { length: 64 }).unique().notNull(),
    password: varchar('password', { length: 64 }).notNull(),
    createdAt: timestamp('created_at').notNull(),
})

export type User = InferSelectModel<typeof user>;