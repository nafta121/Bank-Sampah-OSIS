import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Routes
app.post('/api/ai/analyze-waste', async (req, res) => {
  try {
    const { category, weightKg, description, imageBase64 } = req.body;
    const parts: any[] = [];

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
        },
      });
    }

    parts.push({
      text: `Sebagai Asisten Pakar Lingkungan Hidup dan Konsultan Bank Sampah Sekolah OSIS:
Analisis setoran sampah berikut:
- Kategori yang diinput: ${category || 'Belum dipilih'}
- Estimasi Berat: ${weightKg || '0'} kg
- Catatan / Kondisi: ${description || 'Sampah pilahan siswa'}

Berikan respons JSON murni dengan format spesifik berikut:
{
  "categoryRecommended": "nama kategori tepat (Plastik & Botol / Kertas & Karton / Logam & Kaleng / Minyak Jelantah / Elektronik / Anorganik Lain)",
  "pointEstimate": angka integer poin (misal 10 poin per kg kertas, 20 per kg plastik, 35 per kg kaleng),
  "cashEstimate": angka estimasi nilai rupiah (misal Rp 2500/kg plastik, Rp 1500/kg kertas, Rp 5000/kg logam),
  "ecoImpact": {
    "co2SavedKg": perkiraan angka kg CO2 yang dicegah (angka float, misal 1.8),
    "waterSavedLiter": perkiraan liter air yang dihemat (integer),
    "treeEquivalent": deskripsi singkat dampak pohon/energi
  },
  "segregationTip": "Tips pemilahan tepat agar nilai jual sampah maksimal di bank sampah sekolah (maks 2 kalimat ringkas)",
  "upcycleIdea": "Ide kreasi daur ulang yang cocok untuk proyek kelas siswa (maks 2 kalimat)"
}`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text?.trim() || '{}';
    const parsed = JSON.parse(jsonText);
    res.json(parsed);
  } catch (err: any) {
    console.error('Error analyzing waste:', err);
    // Fallback heuristic if API unavailable
    const fallbackWeight = Number(req.body.weightKg) || 1;
    res.json({
      categoryRecommended: req.body.category || 'Plastik & Botol',
      pointEstimate: Math.round(fallbackWeight * 20),
      cashEstimate: Math.round(fallbackWeight * 2500),
      ecoImpact: {
        co2SavedKg: Number((fallbackWeight * 1.5).toFixed(1)),
        waterSavedLiter: Math.round(fallbackWeight * 12),
        treeEquivalent: `Setara dengan pelestarian ${Math.max(1, Math.round(fallbackWeight * 0.2))} bibit pohon sekolah`,
      },
      segregationTip: 'Pastikan sampah dalam keadaan kering dan bersih dari sisa makanan/cairan agar poin maksimal.',
      upcycleIdea: 'Dapat dijadikan pot hidroponik vertikal untuk taman penghijauan kelas.',
    });
  }
});

app.post('/api/ai/monthly-summary', async (req, res) => {
  try {
    const { month, totalKg, totalTransactions, totalCash, topClasses, categoryBreakdown } = req.body;
    const prompt = `Buatkan laporan eksekutif dan motivasi untuk Bank Sampah Sekolah OSIS bulan ${month}:
Data Statistik Operasional:
- Total Sampah Terkumpul: ${totalKg} kg
- Total Transaksi Masuk: ${totalTransactions} kali setor
- Total Nilai Kas Terkumpul: Rp ${Number(totalCash || 0).toLocaleString('id-ID')}
- Kelas Teraktif: ${JSON.stringify(topClasses || [])}
- Breakdown Kategori: ${JSON.stringify(categoryBreakdown || {})}

Berikan output format JSON valid:
{
  "headline": "Judul laporan inspiratif untuk mading & pengumuman sekolah",
  "executiveSummary": "Ringkasan capaian lingkungan sekolah 2 paragraf formal dan apresiatif untuk kepala sekolah & OSIS",
  "ecoAchievements": [
    "Daftar 3 poin capaian dampak lingkungan nyata (misal: penghematan CO2, sampah dicegah ke TPA, liter air bersih terselamatkan)"
  ],
  "classShoutouts": "Apresiasi khusus untuk kelas juara dan motivasi untuk kelas lainnya",
  "recommendationsForNextMonth": [
    "3 saran aksi strategis untuk pengurus OSIS meningkatkan partisipasi bulan depan"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text?.trim() || '{}';
    res.json(JSON.parse(jsonText));
  } catch (err: any) {
    console.error('Error generating summary:', err);
    res.json({
      headline: `Laporan Konsistensi Ekologis Bank Sampah OSIS - Periode ${req.body.month || 'Bulan Ini'}`,
      executiveSummary: `Pada periode ini, seluruh kelas telah berhasil mengumpulkan total ${req.body.totalKg || 0} kg sampah daur ulang melalui ${req.body.totalTransactions || 0} transaksi. Inisiatif Bank Sampah OSIS terus mendorong budaya peduli lingkungan serta memperkuat kemandirian finansial kas kelas melalui daur ulang bernilai ekonomis.`,
      ecoAchievements: [
        `Mencegah sekitar ${((req.body.totalKg || 0) * 1.6).toFixed(1)} kg emisi karbon (CO2) ke atmosfer`,
        `Mengurangi beban tempat pemrosesan akhir (TPA) lokal sekolah`,
        `Menghasilkan dana kas produktif bagi siswa sebesar Rp ${Number(req.body.totalCash || 0).toLocaleString('id-ID')}`,
      ],
      classShoutouts: `Apresiasi tinggi kepada kelas-kelas terdepan yang aktif memilah sampah setiap minggu. Tetap pertahankan semangat adiwiyata sekolah!`,
      recommendationsForNextMonth: [
        'Mengadakan kompetisi mingguan bertema "Jumat Bersih Berpoin"',
        'Edukasi cara pemilahan minyak jelantah dan e-waste kelas',
        'Penukaran poin massal untuk peremajaan fasilitas kebersihan kelas',
      ],
    });
  }
});

// Vite middleware in dev or static serve in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
