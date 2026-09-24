import { AiWasteAnalysis, AiMonthlySummary, WasteCategory } from '../types/index.ts';

export async function requestAiWasteAnalysis(
  category: WasteCategory,
  weightKg: number,
  description?: string,
  imageBase64?: string
): Promise<AiWasteAnalysis> {
  const resp = await fetch('/api/ai/analyze-waste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, weightKg, description, imageBase64 }),
  });

  if (!resp.ok) {
    throw new Error('Gagal memproses analisis AI');
  }

  return await resp.json();
}

export async function requestAiMonthlySummary(params: {
  month: string;
  totalKg: number;
  totalTransactions: number;
  totalCash: number;
  topClasses: { name: string; points: number; weight: number }[];
  categoryBreakdown: Record<string, number>;
}): Promise<AiMonthlySummary> {
  const resp = await fetch('/api/ai/monthly-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!resp.ok) {
    throw new Error('Gagal membuat ringkasan AI');
  }

  return await resp.json();
}
