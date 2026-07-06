#!/bin/bash
sed -i '/{isUsersLoading ? (/,/        ) : (/c\
        <SectionErrorBoundary\
          isLoading={isUsersLoading}\
          error={usersError}\
          onRetry={handleTryAgain}\
          skeleton={<InstitutionSkeleton />}\
          errorTitle="Koneksi Database Gagal"\
          errorMessage="Gagal memuat Profil Lembaga Pendidikan dari Firestore. Silakan periksa koneksi Anda dan coba kembali."\
        >' src/App.tsx

sed -i '/{isAnnsLoading ? (/,/        ) : annsError ? (/c\
        <div className="space-y-3">\
          <div className="flex items-center justify-between text-[#015e2a] px-2 select-none">\
            <div className="flex items-center gap-2">\
              <Bell className="w-5 h-5 text-[#015e2a] stroke-[2.5]" />\
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">\
                PROGRAM \& KEGIATAN YAYASAN\
              </h3>\
            </div>\
          </div>\
          <SectionErrorBoundary\
            isLoading={isAnnsLoading}\
            error={annsError}\
            onRetry={handleTryAgain}\
            skeleton={<ProgramEventSkeleton />}\
            errorTitle="Koneksi Database Gagal"\
            errorMessage="Gagal memuat program & kegiatan yayasan dari Firestore. Silakan periksa koneksi Anda dan coba kembali."\
          >' src/App.tsx

