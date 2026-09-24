import { ClassProfile, WasteTransaction } from '../types/index.ts';

export interface ExportSheetsResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  rowsWritten: number;
}

export async function exportToGoogleSheets(
  accessToken: string,
  monthName: string,
  classes: ClassProfile[],
  transactions: WasteTransaction[],
  executiveSummary?: string
): Promise<ExportSheetsResult> {
  if (!accessToken) {
    throw new Error('Akses Google Sheets belum diotorisasi. Silakan hubungkan akun Google terlebih dahulu.');
  }

  // 1. Create a new Google Spreadsheet
  const title = `Laporan Bank Sampah OSIS - ${monthName} ${new Date().getFullYear()}`;
  const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Ringkasan & Poin Kelas',
            gridProperties: { rowCount: 100, columnCount: 10 },
          },
        },
        {
          properties: {
            title: 'Riwayat Transaksi',
            gridProperties: { rowCount: 500, columnCount: 10 },
          },
        },
      ],
    }),
  });

  if (!createResp.ok) {
    const errText = await createResp.text();
    throw new Error(`Gagal membuat Google Spreadsheet: ${errText}`);
  }

  const sheetData = await createResp.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare Data for Sheet 1: Ringkasan & Poin Kelas
  const totalKg = classes.reduce((sum, c) => sum + (c.totalWeightKg || 0), 0);
  const totalBalance = classes.reduce((sum, c) => sum + (c.balance || 0), 0);
  const totalPoints = classes.reduce((sum, c) => sum + (c.points || 0), 0);

  const sortedClasses = [...classes].sort((a, b) => (b.points || 0) - (a.points || 0));

  const summaryValues: (string | number)[][] = [
    ['LAPORAN OPERASIONAL BANK SAMPAH SEKOLAH OSIS'],
    ['Periode:', monthName, 'Tahun:', new Date().getFullYear()],
    ['Diekspor pada:', new Date().toLocaleString('id-ID')],
    ['Ringkasan AI Eksekutif:', executiveSummary || 'Program pemilahan sampah berjalan aktif dengan partisipasi antar kelas.'],
    [''],
    ['STATISTIK KESELURUHAN SEKOLAH'],
    ['Total Sampah Terkumpul (Kg)', totalKg.toFixed(2)],
    ['Total Poin Aktif Kelas', totalPoints],
    ['Total Saldo Kas Terkumpul (Rp)', totalBalance],
    [''],
    ['KLASEMEN POIN & PRESTASI KELAS'],
    ['Peringkat', 'ID Kelas', 'Nama Kelas', 'Perwakilan / Sie Lingkungan', 'Total Berat (Kg)', 'Poin Terkumpul', 'Saldo Kas (Rp)'],
  ];

  sortedClasses.forEach((cls, idx) => {
    summaryValues.push([
      idx + 1,
      cls.classId,
      cls.name,
      cls.representative || '-',
      cls.totalWeightKg || 0,
      cls.points || 0,
      cls.balance || 0,
    ]);
  });

  // 3. Prepare Data for Sheet 2: Riwayat Transaksi
  const txValues: (string | number)[][] = [
    ['RIWAYAT TRANSAKSI SETOR SAMPAH KELAS'],
    ['Waktu Setor', 'ID Transaksi', 'ID Kelas', 'Kategori Sampah', 'Berat (Kg)', 'Poin Diperoleh', 'Nilai Kas (Rp)', 'Petugas OSIS', 'Status'],
  ];

  transactions.forEach((tx) => {
    txValues.push([
      new Date(tx.timestamp).toLocaleString('id-ID'),
      tx.transactionId,
      tx.classId,
      tx.category,
      tx.weightKg,
      tx.pointsEarned,
      tx.cashEarned,
      tx.recordedBy || 'OSIS Staff',
      tx.status === 'pending' ? 'Offline Pending' : 'Tersinkron',
    ]);
  });

  // 4. Batch update values to Google Sheets
  const updateBody = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: "'Ringkasan & Poin Kelas'!A1",
        values: summaryValues,
      },
      {
        range: "'Riwayat Transaksi'!A1",
        values: txValues,
      },
    ],
  };

  const updateResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateBody),
    }
  );

  if (!updateResp.ok) {
    const errText = await updateResp.text();
    throw new Error(`Gagal menulis data ke Google Sheets: ${errText}`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    rowsWritten: summaryValues.length + txValues.length,
  };
}
