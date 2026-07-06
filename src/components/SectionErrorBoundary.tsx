import React, { ReactNode } from 'react';
import { DataError } from './DataError';

interface SectionErrorBoundaryProps {
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  skeleton: ReactNode;
  children: ReactNode;
  errorTitle?: string;
  errorMessage?: string;
}

export function SectionErrorBoundary({
  isLoading,
  error,
  onRetry,
  skeleton,
  children,
  errorTitle = "Koneksi Database Gagal",
  errorMessage = "Gagal memuat data dari Firestore. Silakan periksa koneksi Anda dan coba kembali."
}: SectionErrorBoundaryProps) {
  if (isLoading) {
    return <>{skeleton}</>;
  }

  if (error) {
    return (
      <DataError
        title={errorTitle}
        message={error ? error : errorMessage}
        onRetry={onRetry}
      />
    );
  }

  return <>{children}</>;
}
