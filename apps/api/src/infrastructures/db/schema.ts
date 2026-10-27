import { bigint, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const skills = pgTable(
  "skills",
  {
    id: bigint("id", { mode: "bigint" }).primaryKey().generatedByDefaultAsIdentity(),
    name: text("name").notNull(),
    displayOrder: integer("display_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("skills_display_order_idx").on(table.displayOrder)],
);
