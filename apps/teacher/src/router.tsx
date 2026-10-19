// A tiny hash router: "#/learn/2" → ["learn", "2"]. Hash URLs work on any static host.
import { useEffect, useState, type AnchorHTMLAttributes } from "react";

const parse = () =>
  window.location.hash
    .replace(/^#\/?/, "")
    .split("/")
    .filter((s) => s.length > 0);

export function useRoute(): string[] {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export const navigate = (to: string) => {
  window.location.hash = to;
};

export function Link({ to, ...rest }: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a href={`#${to}`} {...rest} />;
}
