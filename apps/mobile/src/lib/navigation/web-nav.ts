export interface WebNavRoute {
  href: string;
  matches?: readonly string[];
}

/** Expo Router menghapus route group seperti `(platform)` dari URL browser. */
export function publicWebPath(href: string) {
  const value = href.replace(/\/\([^/]+\)/g, '');
  return value || '/';
}

export function webRouteMatches(item: WebNavRoute, pathname: string) {
  const candidates = [item.href, ...(item.matches ?? [])].map(publicWebPath);
  return candidates.some((candidate) =>
    candidate === '/'
      ? pathname === '/'
      : pathname === candidate || pathname.startsWith(`${candidate}/`),
  );
}
