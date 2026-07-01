// Client-side PDF export for the ID Durability Simulator.
// Adapted from the original pdfGenerator; fully offline (pdfmake + bundled VFS).

import { formatCurrency, formatNumber, formatPercentage } from './formatting';
import type { UnifiedResults } from '@/core';
import { MEETING_BOOKING_URL } from '@/config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfMakeInstance: any = null;

const initPdfMake = async () => {
  if (!pdfMakeInstance) {
    const [pdfMake, pdfFonts] = await Promise.all([
      import('pdfmake/build/pdfmake'),
      import('pdfmake/build/vfs_fonts'),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fonts = pdfFonts as any;
    const vfs =
      fonts.pdfMake?.vfs ||
      fonts.default?.pdfMake?.vfs ||
      fonts.default?.vfs ||
      fonts.vfs ||
      (typeof fonts.default === 'object' && fonts.default);
    if (!vfs) throw new Error('PDF fonts could not be loaded');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pdfMake as any).default.vfs = vfs;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfMakeInstance = (pdfMake as any).default;
  }
  return pdfMakeInstance;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildDoc = (results: UnifiedResults): any => {
  const t = results.totals;
  const id = results.idInfrastructure;
  const d = id.details;
  const risk = results.riskScenario ?? 'moderate';

  return {
    pageSize: 'A4',
    pageMargins: [40, 64, 40, 56],
    header: () => ({
      columns: [
        { text: 'AdFixus', style: 'brand', margin: [40, 24, 0, 0] },
        {
          text: 'Identity Durability - Revenue Impact',
          style: 'reportTitle',
          alignment: 'right',
          margin: [0, 27, 40, 0],
        },
      ],
    }),
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: 'Estimates only. Not a commercial offer.', style: 'footer', margin: [40, 0, 0, 0] },
        {
          text: `${currentPage} of ${pageCount}`,
          style: 'footer',
          alignment: 'right',
          margin: [0, 0, 40, 0],
        },
      ],
    }),
    content: [
      { text: 'Executive Summary', style: 'h1', margin: [0, 16, 0, 12] },
      {
        text: `Safari's tracking limits leave a large share of your audience unaddressable, forcing that inventory into lower-value contextual sales. A durable AdFixus identity recovers that addressability, lifting CPMs on newly matched impressions and reducing identity bloat in your data platform.`,
        style: 'body',
        margin: [0, 0, 0, 16],
      },
      {
        columns: [
          kpi('Annual recoverable revenue', formatCurrency(t.totalAnnualUplift), 'With durable ID'),
          kpi('Monthly uplift', formatCurrency(t.totalMonthlyUplift), `${formatPercentage(t.percentageImprovement, 1)} of ad revenue`),
          kpi('3-year projection', formatCurrency(t.threeYearProjection), `${risk} outlook`),
        ],
        columnGap: 12,
        margin: [0, 0, 0, 20],
      },
      { text: 'Addressability Recovery', style: 'h2', margin: [0, 8, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            [th('Metric'), th('Today'), th('With AdFixus')],
            ['Safari / iOS traffic share', formatPercentage(d.safariShare, 0), formatPercentage(d.safariShare, 0)],
            ['Safari addressability', formatPercentage(d.currentSafariAddressability, 0), formatPercentage(d.targetSafariAddressability, 0)],
            ['Total inventory addressable', formatPercentage(d.currentAddressability, 0), formatPercentage(d.improvedAddressability, 0)],
            ['Newly addressable impressions / mo', '-', formatNumber(d.newlyAddressableImpressions)],
          ],
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#0e1a1f' : rowIndex % 2 === 0 ? '#f6fafb' : null),
          hLineColor: () => '#dbe7ea',
          vLineColor: () => '#dbe7ea',
        },
        margin: [0, 0, 0, 20],
      },
      { text: 'Value Drivers', style: 'h2', margin: [0, 8, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto'],
          body: [
            [th('Driver'), th('Monthly value')],
            ['Addressability & CPM recovery', formatCurrency(d.addressabilityRevenue)],
            ['CDP / data-platform savings', formatCurrency(d.monthlyCdpSavings)],
            [{ text: 'Total monthly uplift', bold: true }, { text: formatCurrency(t.totalMonthlyUplift), bold: true }],
          ],
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#0e1a1f' : null),
          hLineColor: () => '#dbe7ea',
          vLineColor: () => '#dbe7ea',
        },
        margin: [0, 0, 0, 20],
      },
      { text: 'Next Steps', style: 'h2', margin: [0, 8, 0, 8] },
      {
        text: 'See these numbers against your real inventory in a 30-minute session with the AdFixus team.',
        style: 'body',
        margin: [0, 0, 0, 8],
      },
      { text: 'Book a meeting', style: 'link', link: MEETING_BOOKING_URL, margin: [0, 0, 0, 4] },
    ],
    styles: {
      brand: { fontSize: 15, bold: true, color: '#0aa5d8' },
      reportTitle: { fontSize: 11, bold: true, color: '#334155' },
      h1: { fontSize: 18, bold: true, color: '#0f172a' },
      h2: { fontSize: 13, bold: true, color: '#0f172a' },
      body: { fontSize: 10, color: '#475569', lineHeight: 1.4 },
      footer: { fontSize: 8, color: '#94a3b8' },
      link: { fontSize: 11, bold: true, color: '#0aa5d8', decoration: 'underline' },
      kpiHeader: { fontSize: 8, bold: true, color: '#64748b', alignment: 'center', margin: [4, 8, 4, 3] },
      kpiValue: { fontSize: 15, bold: true, color: '#0aa5d8', alignment: 'center', margin: [4, 2, 4, 2] },
      kpiSub: { fontSize: 8, color: '#94a3b8', alignment: 'center', margin: [4, 2, 4, 8] },
    },
  };
};

const kpi = (header: string, value: string, sub: string) => ({
  width: '33%',
  table: {
    widths: ['*'],
    body: [
      [{ text: header, style: 'kpiHeader' }],
      [{ text: value, style: 'kpiValue' }],
      [{ text: sub, style: 'kpiSub' }],
    ],
  },
  layout: {
    fillColor: () => '#f6fafb',
    hLineColor: () => '#e2eaed',
    vLineColor: () => '#e2eaed',
  },
});

const th = (text: string) => ({ text, bold: true, color: '#e2f5fb', fontSize: 9 });

export const downloadIdProposalPdf = async (results: UnifiedResults): Promise<void> => {
  const pdfMake = await initPdfMake();
  const doc = buildDoc(results);
  await new Promise<void>((resolve, reject) => {
    pdfMake.createPdf(doc).getBlob((blob: Blob) => {
      try {
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (!win) {
          const link = document.createElement('a');
          link.href = url;
          link.download = 'AdFixus-ID-Durability.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
};
