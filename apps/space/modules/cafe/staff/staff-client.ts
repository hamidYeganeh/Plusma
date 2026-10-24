export class RequestError extends Error {
  constructor(readonly status: number) {
    super("Staff request failed");
  }
}
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/staff${path}`, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    signal: init?.signal ?? AbortSignal.timeout(15000),
    headers: { Accept: "application/json", ...init?.headers },
  });
  if (!response.ok) throw new RequestError(response.status);
  return response.json() as Promise<T>;
}
export function message(error: unknown) {
  if (error instanceof RequestError) {
    if (error.status === 401)
      return "نشست شما پایان یافته است؛ دوباره وارد شوید.";
    if (error.status === 403) return "برای این مکان دسترسی ندارید.";
    if (error.status === 400)
      return "اطلاعات واردشده معتبر نیست. ورودی‌ها را بررسی کنید.";
    if (error.status === 409 || error.status === 410)
      return "اطلاعات یا وضعیت تغییر کرده است. فهرست را تازه کنید و دوباره تلاش کنید.";
    if (error.status === 429)
      return "تعداد تلاش‌ها زیاد است؛ کمی بعد دوباره امتحان کنید.";
  }
  return "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.";
}
export const number = new Intl.NumberFormat("fa");
export const money = (rials: number) => `${number.format(rials / 10)} تومان`;
