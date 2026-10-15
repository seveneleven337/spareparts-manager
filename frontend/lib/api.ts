const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = Omit<RequestInit, "body" | "method">;

async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  let requestBody: string | undefined;

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
      ...options,
      method,
      headers,
      body: requestBody,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      `Cannot connect to the API Gateway at ${API_BASE_URL}. Check that the backend is running.`,
      0,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";

  let responseData: unknown = undefined;

  if (response.status !== 204) {
    if (contentType.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch {
        throw new ApiError(
          "The API returned an invalid JSON response.",
          response.status,
        );
      }
    } else {
      const responseText = await response.text();

      if (responseText) {
        responseData = responseText;
      }
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    if (
      typeof responseData === "object" &&
      responseData !== null &&
      "detail" in responseData
    ) {
      const detail = responseData.detail;

      message =
        typeof detail === "string"
          ? detail
          : JSON.stringify(detail);
    } else if (typeof responseData === "string") {
      message = responseData;
    }

    throw new ApiError(message, response.status, responseData);
  }

  return responseData as T;
}

export function apiGet<T>(
  path: string,
  options?: RequestOptions,
): Promise<T> {
  return apiRequest<T>(path, "GET", undefined, options);
}

export function apiPost<T>(
  path: string,
  body: unknown,
  options?: RequestOptions,
): Promise<T> {
  return apiRequest<T>(path, "POST", body, options);
}

export function apiPatch<T>(
  path: string,
  body: unknown,
  options?: RequestOptions,
): Promise<T> {
  return apiRequest<T>(path, "PATCH", body, options);
}

export function apiDelete<T = void>(
  path: string,
  options?: RequestOptions,
): Promise<T> {
  return apiRequest<T>(path, "DELETE", undefined, options);
}