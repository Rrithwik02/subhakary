import { useEffect, useRef, useState } from "react";

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const { threshold = 0.1, rootMargin = "0px", triggerOnce = true } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isInView };
};

// Component wrapper for scroll animations
import { ReactNode } from "react";

interface ScrollAnimateProps {
  children: ReactNode;
  className?: string;
  animation?: "fade-up" | "fade-left" | "fade-right" | "scale" | "none";
  delay?: number;
  threshold?: number;
  triggerOnce?: boolean;
}

export const ScrollAnimate = ({
  children,
  className = "",
  animation = "fade-up",
  delay = 0,
  threshold = 0.1,
  triggerOnce = true,
}: ScrollAnimateProps) => {
  const { ref, isInView } = useScrollAnimation({ threshold, triggerOnce });

  const animationClasses = {
    "fade-up": "scroll-animate",
    "fade-left": "scroll-animate-left",
    "fade-right": "scroll-animate-right",
    scale: "scroll-animate-scale",
    none: "",
  };

  const delayStyle = delay > 0 ? { transitionDelay: `${delay}ms` } : {};

  return (
    <div
      ref={ref}
      className={`${animationClasses[animation]} ${isInView ? "in-view" : ""} ${className}`}
      style={delayStyle}
    >
      {children}
    </div>
  );
};
