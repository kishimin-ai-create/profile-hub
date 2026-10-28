import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const section = pgEnum("section", ["engineering", "hobby"]);

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

export const favourites = pgTable(
  "favourites",
  {
    id: bigint("id", { mode: "bigint" }).primaryKey().generatedByDefaultAsIdentity(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    link: text("link").notNull(),
    displayOrder: integer("display_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("favourites_display_order_idx").on(table.displayOrder),
    check("favourites_link_scheme_check", sql`${table.link} ~* '^https?://'`),
  ],
);

export const socialLinks = pgTable(
  "social_links",
  {
    id: bigint("id", { mode: "bigint" }).primaryKey().generatedByDefaultAsIdentity(),
    section: section("section").notNull(),
    kind: text("kind").notNull(),
    url: text("url").notNull(),
    displayOrder: integer("display_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("social_links_section_display_order_idx").on(table.section, table.displayOrder),
    check(
      "social_links_url_scheme_check",
      sql`${table.url} ~* '^https?://' OR (${table.kind} = 'email' AND ${table.url} ~* '^mailto:')`,
    ),
  ],
);

export const portfolios = pgTable(
  "portfolios",
  {
    id: bigint("id", { mode: "bigint" }).primaryKey().generatedByDefaultAsIdentity(),
    section: section("section").notNull(),
    name: text("name").notNull(),
    summary: text("summary").notNull(),
    technologies: text("technologies").array().notNull(),
    repositoryUrl: text("repository_url"),
    demoUrl: text("demo_url"),
    imageUrl: text("image_url"),
    displayOrder: integer("display_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("portfolios_section_display_order_idx").on(table.section, table.displayOrder)],
);

export const profiles = pgTable("profiles", {
  id: bigint("id", { mode: "bigint" }).primaryKey().generatedByDefaultAsIdentity(),
  name: text("name").notNull(),
  title: text("title"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: bigint("id", { mode: "bigint" }).primaryKey().generatedByDefaultAsIdentity(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    sessionVersion: integer("session_version").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("users_session_version_nonnegative", sql`${table.sessionVersion} >= 0`)],
);
