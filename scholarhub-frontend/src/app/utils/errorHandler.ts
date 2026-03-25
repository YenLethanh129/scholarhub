/**
 * Utility functions for handling HTTP errors and navigating to error pages
 */

/**
 * Map HTTP status codes to error page routes
 */
export function getErrorPageRoute(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "/error/400";
    case 401:
      return "/error/401";
    case 403:
      return "/error/403";
    case 404:
      return "/error/404";
    case 500:
      return "/error/500";
    case 503:
      return "/error/503";
    default:
      return "/error/500";
  }
}

/**
 * Get error message in Vietnamese for HTTP status codes
 */
export function getErrorMessage(statusCode: number): string {
  const messages: Record<number, string> = {
    400: "Yêu cầu không hợp lệ",
    401: "Chưa được xác thực",
    403: "Truy cập bị từ chối",
    404: "Không tìm thấy",
    500: "Lỗi máy chủ",
    503: "Dịch vụ không khả dụng",
  };

  return messages[statusCode] || "Đã xảy ra lỗi";
}

/**
 * Check if status code is a client error (4xx)
 */
export function isClientError(statusCode: number): boolean {
  return statusCode >= 400 && statusCode < 500;
}

/**
 * Check if status code is a server error (5xx)
 */
export function isServerError(statusCode: number): boolean {
  return statusCode >= 500 && statusCode < 600;
}

/**
 * Parse error response from API and return error message
 */
export function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    if ("message" in error) {
      return String(error.message);
    }
    if ("error" in error) {
      return String(error.error);
    }
  }

  return "Đã xảy ra lỗi không xác định";
}

/**
 * Create a fetch wrapper that handles errors globally
 */
export async function fetchWithErrorHandling(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    // If status is 401, user should be redirected to login
    if (response.status === 401) {
      window.location.href = "/error/401";
      throw new Error("Vui lòng đăng nhập lại");
    }

    // If status is 403, show forbidden page
    if (response.status === 403) {
      window.location.href = "/error/403";
      throw new Error("Bạn không có quyền truy cập tài nguyên này");
    }

    // If status is 404, show not found page
    if (response.status === 404) {
      window.location.href = "/error/404";
      throw new Error("Tài nguyên không tìm thấy");
    }

    // If status is 500+, show server error page
    if (response.status >= 500) {
      window.location.href = getErrorPageRoute(response.status);
      throw new Error(`Lỗi máy chủ: ${response.status}`);
    }

    return response;
  } catch (error) {
    throw error;
  }
}
