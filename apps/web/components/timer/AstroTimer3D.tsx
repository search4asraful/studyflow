'use client';

import React from 'react';
import { PomodoroTimer, PomodoroTimerProps } from './PomodoroTimer';

export type AstroTimer3DProps = PomodoroTimerProps;

export const AstroTimer3D: React.FC<AstroTimer3DProps> = (props) => {
  return <PomodoroTimer {...props} />;
};

export default AstroTimer3D;
