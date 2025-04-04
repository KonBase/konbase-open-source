
import React from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface LinkProps extends RouterLinkProps {
  className?: string;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <RouterLink
        className={cn('text-primary underline-offset-4 hover:underline', className)}
        ref={ref}
        {...props}
      >
        {children}
      </RouterLink>
    );
  }
);
Link.displayName = 'Link';

export { Link };
