// Small fetch helpers for the case API. Only same-origin /api calls are made.

export type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string };

export async function readJson<T>(res: Response): Promise<ApiResult<T>> {
  const body = (await res.json().catch(() => null)) as
    | (T & { message?: string; error?: string })
    | null;
  if (res.ok && body) return { ok: true, data: body };
  if (res.status === 401) {
    return { ok: false, message: "Your session has expired. Sign in again." };
  }
  if (res.status === 404) return { ok: false, message: "This case was not found." };
  if (res.status === 503) {
    return { ok: false, message: "Supabase is not configured yet." };
  }
  return {
    ok: false,
    message: body?.message ?? "Something went wrong. Please try again.",
  };
}
