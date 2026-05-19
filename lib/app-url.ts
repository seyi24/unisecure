export function getAppOrigin() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000";

  return raw.replace(/\/$/, "");
}

export function buildAppUrl(path: string) {
  const base = getAppOrigin();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return `${base}${basePath}${normalizedPath}`;
}
