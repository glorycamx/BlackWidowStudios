import { forwardRef, type AnchorHTMLAttributes } from "react";
import { navigate } from "./nav";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean };

/** next/link stand-in: client-side navigation through the in-memory router. */
const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, prefetch: _p, onClick, target, ...rest }, ref) {
  void _p;
  return (
    <a
      ref={ref}
      href={href}
      target={target}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        navigate(href);
      }}
      {...rest}
    />
  );
});

export default Link;
