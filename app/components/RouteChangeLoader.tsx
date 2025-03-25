'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Loading from '../loading';

export default function RouteChangeLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let mounted = true;

    const startLoading = () => {
      if (mounted) setIsLoading(true);
    };

    const stopLoading = () => {
      // Add a small delay to ensure content is rendered
      setTimeout(() => {
        if (mounted) setIsLoading(false);
      }, 500);
    };

    startLoading();
    stopLoading();

    return () => {
      mounted = false;
    };
  }, [pathname, searchParams]);

  if (!isLoading) return null;
  return <Loading />;
} 