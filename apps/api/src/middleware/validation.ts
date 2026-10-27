import { sValidator } from "@hono/standard-validator";

/** Validates JSON and exposes only approved field names in error responses. */
export function validateJson<Schema extends Parameters<typeof sValidator>[1]>(
  schema: Schema,
  allowedFields: readonly string[],
) {
  return sValidator("json", schema, (result, context) => {
    if (!result.success) {
      const fields = result.error.slice(0, 20).flatMap((issue) => {
        const field = issue.path?.[0];
        return typeof field === "string" && allowedFields.includes(field)
          ? [{ field, message: "Invalid value" }]
          : [];
      });
      return context.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid request", fields } },
        400,
      );
    }
  });
}
