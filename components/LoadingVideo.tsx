interface LoadingVideoProps {
  size?: number;
}

export function LoadingVideo({ size = 120 }: LoadingVideoProps) {
  return (
    <video
      src="/loading.mp4"
      autoPlay
      loop
      muted
      playsInline
      style={{ width: size, height: size }}
      className="object-contain"
    />
  );
}
