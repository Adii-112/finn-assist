"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Transaction {
  amount: number;
  type: string;
  category: string;
}

export default function SpendingChart({ transactions }: { transactions: Transaction[] }) {

  const categoryTotals: Record<string, number> = {};

  transactions.forEach(t => {
    if (t.type === "expense") {
      categoryTotals[t.category] =
        (categoryTotals[t.category] || 0) + t.amount;
    }
  });

  const data = Object.keys(categoryTotals).map(category => ({
    category,
    amount: categoryTotals[category]
  }));

  return (
    <div className="bg-slate-900 p-6 rounded-xl">
      <h2 className="text-xl font-semibold mb-4">
        Spending by Category
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="amount" fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}