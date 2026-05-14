/**
 * Best-effort formatting of driver/database errors for logs and ChatbotError messages.
 */
export function formatDbQueryError(error: unknown): string {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message =
      typeof record.message === "string" ? record.message : "Database error";
    const code = typeof record.code === "string" ? record.code : "";
    const detail = typeof record.detail === "string" ? record.detail : "";
    const columnName =
      typeof record.column_name === "string" ? record.column_name : "";
    const constraintName =
      typeof record.constraint_name === "string"
        ? record.constraint_name
        : "";
    const parts = [
      message,
      code ? `code=${code}` : "",
      detail ? `detail=${detail}` : "",
      columnName ? `column=${columnName}` : "",
      constraintName ? `constraint=${constraintName}` : "",
    ].filter(Boolean);
    return parts.join(" | ");
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
