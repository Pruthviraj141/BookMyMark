import React from 'react';
import { Box, type BoxProps } from './Box.js';

export const Center = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        className={`flex items-center justify-center ${className}`}
        {...props}
      >
        {children}
      </Box>
    );
  }
);
Center.displayName = 'Center';
