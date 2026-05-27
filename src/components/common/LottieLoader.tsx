import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import loaderSrc from "@/assets/lottie/app-loader.lottie?url";
import { cn } from "@/lib/utils";

interface LottieLoaderProps {
  size?: number;
  className?: string;
}

export function LottieLoader({ size = 48, className }: LottieLoaderProps) {
  return (
    <div
      className={cn("inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      <DotLottieReact src={loaderSrc} autoplay loop />
    </div>
  );
}

export function FullScreenLottieLoader({ size = 120 }: { size?: number }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LottieLoader size={size} />
    </div>
  );
}

export default LottieLoader;