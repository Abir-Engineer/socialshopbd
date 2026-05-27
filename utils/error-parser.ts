export interface ParsedError {
  message: string;
  code?: string;
  status?: number;
  details?: string;
  hint?: string;
  isSessionExpired?: boolean;
  isNetworkError?: boolean;
  type: "auth" | "database" | "api" | "validation" | "network" | "unknown";
}

/**
 * Parses any error (Supabase, Auth, network, API, or standard Error)
 * into a standardized, friendly structure.
 */
export function parseError(error: unknown): ParsedError {
  if (!error) {
    return {
      message: "An unknown error occurred.",
      type: "unknown",
    };
  }

  if (typeof error !== "object") {
    return {
      message: String(error),
      type: "unknown",
    };
  }

  // Handle standard ParsedError if already parsed
  if ("type" in error && "message" in error) {
    return error as ParsedError;
  }

  const err = error as Record<string, unknown>;
  const message = String(err.message ?? err.error_description ?? "An unexpected error occurred.");
  const code = err.code ? String(err.code) : err.errorCode ? String(err.errorCode) : undefined;
  let status = err.status ? Number(err.status) : err.statusCode ? Number(err.statusCode) : err.http_status ? Number(err.http_status) : undefined;
  const details = err.details ? String(err.details) : undefined;
  const hint = err.hint ? String(err.hint) : undefined;

  const isNetwork = 
    message.toLowerCase().includes("failed to fetch") ||
    message.toLowerCase().includes("network error") ||
    message.toLowerCase().includes("load failed") ||
    code === "FETCH_ERROR";

  const isSessionExpired =
    status === 401 ||
    code === "session_expired" ||
    code === "invalid_grant" ||
    message.toLowerCase().includes("jwt expired") ||
    message.toLowerCase().includes("token expired") ||
    message.toLowerCase().includes("session expired") ||
    message.toLowerCase().includes("invalid token");

  // Determine error type
  let type: ParsedError["type"] = "unknown";
  if (isNetwork) {
    type = "network";
  } else if (isSessionExpired || code?.startsWith("auth_") || message.toLowerCase().includes("auth")) {
    type = "auth";
  } else if (code && (/^[0-9A-Z]{5}$/.test(code) || code.startsWith("PGRST") || details || hint)) {
    // PostgREST/PostgreSQL error codes are usually 5 characters (e.g. 23505, 42P01) or start with PGRST
    type = "database";
  } else if (status) {
    type = "api";
  }

  // Create friendly messages for common database error codes
  let friendlyMessage = message;
  if (type === "database") {
    switch (code) {
      case "23505":
        friendlyMessage = "A record with this information already exists (duplicate entry).";
        type = "validation";
        break;
      case "23503":
        friendlyMessage = "This action cannot be completed because this record is linked to other data.";
        type = "validation";
        break;
      case "42P01":
        friendlyMessage = "Database table not found. Please run migrations.";
        break;
      case "PGRST116":
        friendlyMessage = "The requested resource was not found.";
        status = 404;
        break;
    }
  }

  if (isNetwork) {
    friendlyMessage = "Network error. Please check your internet connection and try again.";
  }

  if (isSessionExpired) {
    friendlyMessage = "Your session has expired. Please sign in again to continue.";
  }

  return {
    message: friendlyMessage,
    code,
    status,
    details,
    hint,
    isSessionExpired,
    isNetworkError: isNetwork,
    type,
  };
}
