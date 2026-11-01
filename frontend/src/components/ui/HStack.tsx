import React from 'react';
import { Box, type BoxProps } from './Box.js';

export type SpaceSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

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

export interface HStackProps extends BoxProps {
  space?: SpaceSize;
  reversed?: boolean;
}

export const HStack = React.forwardRef<HTMLDivElement, HStackProps>(
  ({ space = 'none', reversed = false, className = '', children, ...props }, ref) => {
    const gapClass = spaceMap[space] || '';
    const dirClass = reversed ? 'flex-row-reverse' : 'flex-row';

    return (
      <Box
        ref={ref}
        className={`flex ${dirClass} items-center ${gapClass} ${className}`}
        {...props}
      >
        {children}
      </Box>
    );
  }
);
HStack.displayName = 'HStack';
