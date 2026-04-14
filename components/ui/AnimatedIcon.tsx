"use client";

import Lottie, { LottieComponentProps } from "lottie-react";
import React from "react";

interface AnimatedIconProps extends Omit<LottieComponentProps, "animationData"> {
  animationData: unknown;
  width?: string | number;
  height?: string | number;
}

export function AnimatedIcon({
  animationData,
  width = 24,
  height = 24,
  style,
  ...props
}: AnimatedIconProps) {
  return (
    <div style={{ width, height, ...style }} className="flex items-center justify-center">
      <Lottie
        animationData={animationData}
        loop={true}
        {...props}
      />
    </div>
  );
}
