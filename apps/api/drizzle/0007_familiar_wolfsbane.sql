CREATE TABLE "login_rate_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"attempts" integer NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	CONSTRAINT "login_rate_limits_singleton" CHECK ("login_rate_limits"."id" = 'login'),
	CONSTRAINT "login_rate_limits_attempts_range" CHECK ("login_rate_limits"."attempts" BETWEEN 0 AND 5)
);
