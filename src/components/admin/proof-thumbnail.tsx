"use client";

import { useState } from "react";
import { FileImage } from "lucide-react";

/**
 * Payment-proof thumbnail that degrades gracefully. Proof files live on the
 * server's private filesystem; if one can't be loaded (missing on this host,
 * deleted, or not an image) we show a clean icon instead of a broken image.
 */
export function ProofThumbnail({
  src,
  alt,
  size = 20,
  className = "h-full w-full object-cover",
  withCaption = false,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  withCaption?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="grid place-items-center gap-1.5 p-4 text-center text-muted">
        <FileImage aria-hidden="true" size={size} />
        {withCaption ? (
          <span className="text-xs">Preview not available on this server</span>
        ) : null}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />
  );
}
