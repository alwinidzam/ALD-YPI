const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const target = `    const chartMonths = [
      'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
    ];
    const INSTITUTIONS: InstitutionType[] = ['YPI', 'SMA', 'MTS', 'MADIN', 'TK', 'PESANTREN'];
    
    const monthlyChartData = chartMonths.map((m) => {
      const dataPoint: { [key: string]: any } = { month: m };
      INSTITUTIONS.forEach((inst) => {
        dataPoint[inst] = documents.filter((doc) => 
          doc.year === chartYear &&
          doc.month.toUpperCase() === m &&
          doc.institution === inst
        ).length;
      });
      return dataPoint;
    });

    const chartYears = ['2024', '2025', '2026'];
    const yearlyChartData = chartYears.map((yr) => {
      const dataPoint: { [key: string]: any } = { year: yr };
      INSTITUTIONS.forEach((inst) => {
        dataPoint[inst] = documents.filter((doc) => 
          doc.year === yr &&
          doc.institution === inst
        ).length;
      });
      return dataPoint;
    });

    const isMonthly = chartPeriod === 'monthly';
    const activeChartData = isMonthly ? monthlyChartData : yearlyChartData;
    const xAxisDataKey = isMonthly ? 'month' : 'year';
    const totalUploadsToShow = isMonthly 
      ? documents.filter((doc) => doc.year === chartYear).length
      : documents.length;`;
const replacement = `    const {
      activeChartData,
      xAxisDataKey,
      totalUploadsToShow
    } = useMemo(() => {
      const chartMonths = [
        'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
        'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
      ];
      const INSTITUTIONS: InstitutionType[] = ['YPI', 'SMA', 'MTS', 'MADIN', 'TK', 'PESANTREN'];
      
      const monthlyChartData = chartMonths.map((m) => {
        const dataPoint: { [key: string]: any } = { month: m };
        INSTITUTIONS.forEach((inst) => {
          dataPoint[inst] = documents.filter((doc) => 
            doc.year === chartYear &&
            doc.month.toUpperCase() === m &&
            doc.institution === inst
          ).length;
        });
        return dataPoint;
      });

      const chartYears = ['2024', '2025', '2026'];
      const yearlyChartData = chartYears.map((yr) => {
        const dataPoint: { [key: string]: any } = { year: yr };
        INSTITUTIONS.forEach((inst) => {
          dataPoint[inst] = documents.filter((doc) => 
            doc.year === yr &&
            doc.institution === inst
          ).length;
        });
        return dataPoint;
      });

      const isMonthly = chartPeriod === 'monthly';
      const activeData = isMonthly ? monthlyChartData : yearlyChartData;
      const xKey = isMonthly ? 'month' : 'year';
      const total = isMonthly 
        ? documents.filter((doc) => doc.year === chartYear).length
        : documents.length;
      return { activeChartData: activeData, xAxisDataKey: xKey, totalUploadsToShow: total };
    }, [documents, chartYear, chartPeriod]);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
