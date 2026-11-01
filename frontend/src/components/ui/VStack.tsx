import React from 'react';
import { Box, type BoxProps } from './Box.js';
import type { SpaceSize } from './HStack.js';

const spaceMap: Record<SpaceSize, string> = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-5',
  '2xl': 'gap-6',
  '3xl': 'gap-7',
  '4xl': 'gap-8'
};

export interface VStackProps extends BoxProps {
  space?: SpaceSize;
  reversed?: boolean;
}

export const VStack = React.forwardRef<HTMLDivElement, VStackProps>(
  ({ space = 'none', reversed = false, className = '', children, ...props }, ref) => {
    const gapClass = spaceMap[space] || '';
    const dirClass = reversed ? 'flex-col-reverse' : 'flex-col';

    return (
      <Box
        ref={ref}
        className={`flex ${dirClass} ${gapClass} ${className}`}
        {...props}
      >
        {children}
      </Box>
    );
  }
);
VStack.displayName = 'VStack';
