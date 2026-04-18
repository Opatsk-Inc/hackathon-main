import { useEffect } from "react";
import { useMotionValue, useTransform, animate, MotionValue } from "framer-motion";

export function useAnimatedNumber(
  value: number,
  duration: number = 2,
  delay: number = 0
): MotionValue<string> {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    Math.round(latest).toLocaleString()
  );

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      delay,
      ease: "easeOut",
    });

    return controls.stop;
  }, [motionValue, value, duration, delay]);

  return rounded;
}
