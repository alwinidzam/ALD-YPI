/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  className?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
}

export function LazyImage({ src, alt, className, referrerPolicy, ...props }: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!window.IntersectionObserver) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (imgRef.current) {
            observer.unobserve(imgRef.current);
          }
        }
      },
      {
        rootMargin: '150px', // Load ahead of time before entering the viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src]);

  // A transparent 1x1 GIF as a lightweight initial source placeholder
  const placeholderSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  return (
    <img
      ref={imgRef}
      src={isInView ? src : placeholderSrc}
      alt={alt}
      className={`${className} transition-opacity duration-300 ${!isLoaded && isInView ? 'animate-pulse opacity-60' : 'opacity-100'}`}
      onLoad={() => setIsLoaded(true)}
      referrerPolicy={referrerPolicy}
      {...props}
    />
  );
}
