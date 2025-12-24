
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const getBusinessInsights = async (transactions: Transaction[], businessName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summary = transactions.reduce((acc, curr) => {
    if (curr.type === 'INCOME') acc.income += curr.amount;
    else acc.expenses += curr.amount;
    return acc;
  }, { income: 0, expenses: 0 });

  const prompt = `
    Analyze the daily business data for "${businessName}".
    Total Income: ₹${summary.income}
    Total Expenses: ₹${summary.expenses}
    Net Profit: ₹${summary.income - summary.expenses}
    
    Recent Transactions:
    ${transactions.slice(-5).map(t => `- ${t.type}: ₹${t.amount} (${t.category})`).join('\n')}

    Please provide a short (2-3 sentence) professional advice on:
    1. Profitability status.
    2. Cost management suggestions (especially if expenses are high).
    3. One growth tip for a tea stall.
    Return only the plain text advice.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate insights at this time. Keep tracking your sales!";
  }
};
