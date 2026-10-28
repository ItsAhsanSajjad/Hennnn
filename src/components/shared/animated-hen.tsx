import Image from "next/image";

interface AnimatedHenProps {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  alt?: string;
  animated?: boolean;
}

export function AnimatedHen({
  size = 160,
  width,
  height,
  className = "",
  imageClassName = "",
  priority = false,
  alt = "GrowMeta 3D Brown Hen",
  animated = true,
}: AnimatedHenProps) {
  const w = width ?? size;
  const h = height ?? size;

  return (
    <div className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}>
      <div className={`relative ${animated ? "hen-idle-animated" : ""}`}>
        <picture>
          <source srcSet="/images/hens/growmeta-hen-3d.avif" type="image/avif" />
          <source srcSet="/images/hens/growmeta-hen-3d.webp" type="image/webp" />
          <Image
            src="/images/hens/growmeta-hen-3d.png"
            alt={alt}
            width={w}
            height={h}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            className={`w-full h-full object-contain drop-shadow-md ${imageClassName}`}
          />
        </picture>
      </div>
    </div>
  );
}
