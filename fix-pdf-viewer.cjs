const fs = require('fs');

let code = fs.readFileSync('src/components/PdfViewer.tsx', 'utf8');

code = code.replace(
  "{isBusy && (",
  `{isBusy && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1e1e1e]/80 backdrop-blur-sm transition-opacity duration-300">
            {/* PDF Skeleton Layout */}
            <div className="w-[90%] max-w-2xl bg-white/5 border border-white/10 h-[70vh] rounded-xl overflow-hidden flex flex-col animate-pulse relative shadow-2xl">
              {/* Header skeleton */}
              <div className="h-12 border-b border-white/5 bg-white/[0.02] flex items-center px-4 gap-4">
                <div className="w-8 h-8 rounded bg-white/10"></div>
                <div className="h-4 w-1/3 rounded bg-white/10"></div>
              </div>
              {/* Body skeleton lines */}
              <div className="p-8 flex flex-col gap-4">
                <div className="h-6 w-3/4 rounded bg-white/10"></div>
                <div className="h-4 w-full rounded bg-white/10"></div>
                <div className="h-4 w-full rounded bg-white/10"></div>
                <div className="h-4 w-5/6 rounded bg-white/10"></div>
                <div className="h-4 w-full rounded bg-white/10"></div>
                <div className="h-32 w-full rounded bg-white/5 mt-4"></div>
              </div>
              
              {/* Overlay Loader */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e1e1e]/60 backdrop-blur-sm">
                <div className="relative flex items-center justify-center mb-5">
                  <div className="w-14 h-14 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin"></div>
                  <FileText className="w-5 h-5 text-emerald-500 absolute" />
                </div>
                <p className="text-xs font-bold text-white uppercase tracking-widest animate-pulse mb-3">
                  Memuat Pratinjau Dokumen...
                </p>
                {/* Progress Bar */}
                <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: \`\${Math.max(5, loadProgress)}%\` }}
                  />
                </div>
                <p className="text-[10px] text-stone-400 font-medium mt-2">{Math.round(loadProgress)}%</p>
              </div>
            </div>
          </div>
        )}
        
        {/* original isBusy block placeholder */}`
);

code = code.replace(
  `{/* original isBusy block placeholder */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1e1e1e]/80 backdrop-blur-sm transition-opacity duration-300">
            <div className="relative flex items-center justify-center mb-5">
              <div className="w-12 h-12 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin"></div>
              <FileText className="w-5 h-5 text-emerald-500 absolute" />
            </div>
            <p className="text-xs font-bold text-white uppercase tracking-widest animate-pulse">
              Memuat Pratinjau ({Math.round(loadProgress)}%)...
            </p>
          </div>
        )}`,
  ``
);

fs.writeFileSync('src/components/PdfViewer.tsx', code);
