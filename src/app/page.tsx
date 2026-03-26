"use client";
import SpendingChart from "@/components/spendingchart";
import { useEffect, useMemo, useState } from "react";

type TransactionType = "income" | "expense";
type RiskLevel = "Low" | "Medium" | "High";

type Transaction = {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: TransactionType;
};

type HealthBreakdownItem = {
  label: string;
  impact: number;
  detail: string;
};

const expenseCategories = [
  "Food",
  "Transport",
  "Rent",
  "Bills",
  "Shopping",
  "Entertainment",
  "Health",
  "Other",
];

const incomeCategories = ["Salary", "Freelance", "Allowance", "Gift", "Other"];

const sampleTransactions: Transaction[] = [
  { id: "1", title: "Part-time salary", amount: 950, category: "Salary", date: "2026-03-01", type: "income" },
  { id: "2", title: "Rent payment", amount: 350, category: "Rent", date: "2026-03-02", type: "expense" },
  { id: "3", title: "Groceries", amount: 78, category: "Food", date: "2026-03-04", type: "expense" },
  { id: "4", title: "Bus pass", amount: 35, category: "Transport", date: "2026-03-06", type: "expense" },
  { id: "5", title: "Freelance design", amount: 220, category: "Freelance", date: "2026-03-10", type: "income" },
  { id: "6", title: "Electricity bill", amount: 44, category: "Bills", date: "2026-03-12", type: "expense" },
  { id: "7", title: "Cinema", amount: 18, category: "Entertainment", date: "2026-03-14", type: "expense" },
  { id: "8", title: "Coffee shop", amount: 14, category: "Food", date: "2026-03-18", type: "expense" },
  { id: "9", title: "Online shopping", amount: 42, category: "Shopping", date: "2026-03-19", type: "expense" },
];

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currency.format(Number.isFinite(value) ? value : 0);
}

function monthKey(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function toMonthStamp(dateString: string) {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function safeParseTransactions(raw: string | null): Transaction[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.amount === "number" &&
        typeof item.category === "string" &&
        typeof item.date === "string" &&
        (item.type === "income" || item.type === "expense")
    );
  } catch {
    return null;
  }
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(800);
  const [savingsGoal, setSavingsGoal] = useState<number>(2000);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [type, setType] = useState<TransactionType>("expense");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const storedTransactions = safeParseTransactions(localStorage.getItem("fin-assist-transactions"));
    const storedBudget = Number(localStorage.getItem("fin-assist-budget"));
    const storedGoal = Number(localStorage.getItem("fin-assist-goal"));
   setTransactions(storedTransactions && storedTransactions.length > 0 ? storedTransactions : sampleTransactions);
    if (Number.isFinite(storedBudget) && storedBudget >= 0) setMonthlyBudget(storedBudget);
    if (Number.isFinite(storedGoal) && storedGoal >= 0) setSavingsGoal(storedGoal);
  }, []);

  useEffect(() => {
    localStorage.setItem("fin-assist-transactions", JSON.stringify(transactions));
  }, [transactions]);
  useEffect(() => {
    localStorage.setItem("fin-assist-budget", String(monthlyBudget));
  }, [monthlyBudget]);
  useEffect(() => {
    localStorage.setItem("fin-assist-goal", String(savingsGoal));
  }, [savingsGoal]);
  useEffect(() => {
    setCategory(type === "expense" ? "Food" : "Salary");
  }, [type]);

  const today = useMemo(() => new Date(), []);
  const currentMonthStamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysElapsed = today.getDate();
  const daysRemaining = Math.max(daysInCurrentMonth - daysElapsed, 0);

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions]
  );

  const currentMonthTransactions = useMemo(
    () => sortedTransactions.filter((item) => toMonthStamp(item.date) === currentMonthStamp),
    [currentMonthStamp, sortedTransactions]
  );

  const totals = useMemo(() => {
    const allIncome = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const allExpenses = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    const currentMonthIncome = currentMonthTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const currentMonthExpenses = currentMonthTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    const balance = allIncome - allExpenses;
    const monthlyBalance = currentMonthIncome - currentMonthExpenses;
    const budgetRemaining = monthlyBudget - currentMonthExpenses;
    const goalProgress = savingsGoal > 0 ? Math.min((Math.max(balance, 0) / savingsGoal) * 100, 100) : 0;
    const savingsRate = allIncome > 0 ? (Math.max(balance, 0) / allIncome) * 100 : 0;
    return { allIncome, allExpenses, balance, currentMonthIncome, currentMonthExpenses, monthlyBalance, budgetRemaining, goalProgress, savingsRate };
  }, [currentMonthTransactions, monthlyBudget, savingsGoal, transactions]);

  const categoryBreakdown = useMemo(() => {
    const breakdown = new Map<string, number>();
    currentMonthTransactions.filter((item) => item.type === "expense").forEach((item) => {
      breakdown.set(item.category, (breakdown.get(item.category) ?? 0) + item.amount);
    });
    return Array.from(breakdown.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: totals.currentMonthExpenses > 0 ? (value / totals.currentMonthExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [currentMonthTransactions, totals.currentMonthExpenses]);

  const monthlyTrend = useMemo(() => {
    const grouped = new Map<string, { label: string; income: number; expense: number }>();
    transactions.forEach((item) => {
      const stamp = toMonthStamp(item.date);
      const current = grouped.get(stamp) ?? { label: monthKey(item.date), income: 0, expense: 0 };
      if (item.type === "income") current.income += item.amount;
      if (item.type === "expense") current.expense += item.amount;
      grouped.set(stamp, current);
    });
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthStamp, values]) => ({ monthStamp, month: values.label, income: values.income, expense: values.expense, net: values.income - values.expense }));
  }, [transactions]);

  const prediction = useMemo(() => {
    const averageDailySpend = daysElapsed > 0 ? totals.currentMonthExpenses / daysElapsed : 0;
    const projectedMonthlySpend = averageDailySpend * daysInCurrentMonth;
    const projectedBudgetGap = projectedMonthlySpend - monthlyBudget;
    let risk: RiskLevel = "Low";
    if (monthlyBudget > 0 && projectedMonthlySpend > monthlyBudget * 1.1) risk = "High";
    else if (monthlyBudget > 0 && projectedMonthlySpend > monthlyBudget * 0.95) risk = "Medium";
    const safeDailyAllowance = daysRemaining > 0 ? Math.max(totals.budgetRemaining, 0) / daysRemaining : 0;
    return { averageDailySpend, projectedMonthlySpend, projectedBudgetGap, risk, safeDailyAllowance };
  }, [daysElapsed, daysInCurrentMonth, daysRemaining, monthlyBudget, totals.budgetRemaining, totals.currentMonthExpenses]);

  const healthScore = useMemo(() => {
    let score = 100;
    const breakdown: HealthBreakdownItem[] = [];
    const topCategory = categoryBreakdown[0];
    if (totals.budgetRemaining < 0) {
      score -= 25;
      breakdown.push({ label: "Over budget", impact: -25, detail: `Current month expenses exceed the budget by ${formatCurrency(Math.abs(totals.budgetRemaining))}.` });
    } else if (monthlyBudget > 0 && totals.currentMonthExpenses > monthlyBudget * 0.85) {
      score -= 10;
      breakdown.push({ label: "Budget pressure", impact: -10, detail: "You have already used more than 85% of the monthly budget." });
    } else {
      breakdown.push({ label: "Budget control", impact: 0, detail: "Current month spending is still within the defined budget." });
    }
    if (totals.savingsRate < 10) {
      score -= 15;
      breakdown.push({ label: "Low savings rate", impact: -15, detail: `Only ${totals.savingsRate.toFixed(0)}% of income is currently retained as savings.` });
    } else if (totals.savingsRate >= 20) {
      breakdown.push({ label: "Healthy savings rate", impact: 0, detail: `Savings rate is ${totals.savingsRate.toFixed(0)}% of total income.` });
    }
    if (topCategory && topCategory.percentage > 40) {
      score -= 12;
      breakdown.push({ label: "High category concentration", impact: -12, detail: `${topCategory.name} represents ${topCategory.percentage.toFixed(0)}% of this month's expenses.` });
    }
    if (totals.balance < 0) {
      score -= 18;
      breakdown.push({ label: "Negative overall balance", impact: -18, detail: "Expenses are higher than income across all recorded data." });
    }
    if (prediction.risk === "High") {
      score -= 15;
      breakdown.push({ label: "High overspending risk", impact: -15, detail: `Projected monthly spending is ${formatCurrency(prediction.projectedMonthlySpend)}.` });
    } else if (prediction.risk === "Medium") {
      score -= 8;
      breakdown.push({ label: "Moderate overspending risk", impact: -8, detail: "Spending trajectory is close to the monthly budget cap." });
    }
    score = clamp(Math.round(score), 0, 100);
    let rating = "Excellent";
    if (score < 80) rating = "Good";
    if (score < 65) rating = "Fair";
    if (score < 45) rating = "Poor";
    return { score, rating, breakdown: breakdown.slice(0, 5) };
  }, [categoryBreakdown, monthlyBudget, prediction.projectedMonthlySpend, prediction.risk, totals.balance, totals.budgetRemaining, totals.currentMonthExpenses, totals.savingsRate]);

  const spendingAnomalies = useMemo(() => {
    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonthStamp = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, "0")}`;
    const currentBreakdown = new Map<string, number>();
    const previousBreakdown = new Map<string, number>();
    transactions.filter((item) => item.type === "expense").forEach((item) => {
      const stamp = toMonthStamp(item.date);
      if (stamp === currentMonthStamp) currentBreakdown.set(item.category, (currentBreakdown.get(item.category) ?? 0) + item.amount);
      if (stamp === previousMonthStamp) previousBreakdown.set(item.category, (previousBreakdown.get(item.category) ?? 0) + item.amount);
    });
    const alerts: string[] = [];
    currentBreakdown.forEach((currentValue, categoryName) => {
      const previousValue = previousBreakdown.get(categoryName) ?? 0;
      if (previousValue > 0 && currentValue >= previousValue * 1.5) {
        const increase = ((currentValue - previousValue) / previousValue) * 100;
        alerts.push(`${categoryName} spending is up ${increase.toFixed(0)}% compared with last month.`);
      }
    });
    if (alerts.length === 0 && prediction.risk === "High") alerts.push("Current month spending velocity is high, even though no single category spike was detected.");
    return alerts.slice(0, 3);
  }, [currentMonthStamp, prediction.risk, today, transactions]);

  const insights = useMemo(() => {
    const notes: string[] = [];
    const topCategory = categoryBreakdown[0];
    notes.push(`This month's expenses are ${formatCurrency(totals.currentMonthExpenses)} against a budget of ${formatCurrency(monthlyBudget)}.`);
    notes.push(`Projected end-of-month spending is ${formatCurrency(prediction.projectedMonthlySpend)} with ${prediction.risk.toLowerCase()} risk.`);
    if (topCategory) notes.push(`${topCategory.name} is currently the largest expense category at ${formatCurrency(topCategory.value)}.`);
    notes.push(`Overall balance across all data is ${formatCurrency(totals.balance)}, and savings progress is ${totals.goalProgress.toFixed(0)}%.`);
    return notes;
  }, [categoryBreakdown, monthlyBudget, prediction.projectedMonthlySpend, prediction.risk, totals.balance, totals.currentMonthExpenses, totals.goalProgress]);

  const spendingSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    const topCategory = categoryBreakdown[0];
    const secondCategory = categoryBreakdown[1];
    if (transactions.length === 0) return ["Add some transactions first so Fin Assist can generate personalised recommendations."];
    if (totals.currentMonthExpenses === 0) return ["No expenses have been recorded for the current month yet, so prediction and optimisation are not available."];
    if (prediction.risk === "High") suggestions.push(`At the current pace you may overspend by ${formatCurrency(Math.max(prediction.projectedBudgetGap, 0))} this month. Reduce discretionary purchases now.`);
    else if (prediction.risk === "Medium") suggestions.push("Your spending trend is close to the budget limit. Delay optional purchases until the end of the month.");
    else suggestions.push("Your current spending pace is sustainable. Maintain the same rate to finish the month within budget.");
    if (topCategory) {
      const recommendedCut = Math.max(Math.round(topCategory.value * 0.12), 5);
      suggestions.push(`Cutting ${formatCurrency(recommendedCut)} from ${topCategory.name} would create immediate room in the budget.`);
    }
    if (secondCategory && secondCategory.percentage >= 18) suggestions.push(`${secondCategory.name} is your second-largest cost driver. Review this category for smaller weekly reductions.`);
    if (prediction.safeDailyAllowance > 0) suggestions.push(`To stay within budget, keep daily spending below roughly ${formatCurrency(prediction.safeDailyAllowance)} for the rest of the month.`);
    if (totals.balance > 0) {
      const suggestedSavings = Math.min(Math.round(totals.balance * 0.2), savingsGoal);
      suggestions.push(`You could move around ${formatCurrency(suggestedSavings)} into savings without disrupting current cash flow.`);
    } else {
      suggestions.push("Focus on restoring a positive balance before increasing the savings contribution.");
    }
    return suggestions.slice(0, 5);
  }, [categoryBreakdown, prediction.projectedBudgetGap, prediction.risk, prediction.safeDailyAllowance, savingsGoal, totals.balance, totals.currentMonthExpenses, transactions.length]);

  function resetForm() {
    setTitle("");
    setAmount("");
    setCategory(type === "expense" ? "Food" : "Salary");
    setDate(new Date().toISOString().slice(0, 10));
    setFormError("");
  }
  function addTransaction() {
    const parsedAmount = Number(amount);
    if (!title.trim()) return setFormError("Please enter a title for the transaction.");
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return setFormError("Amount must be a valid number greater than zero.");
    if (!date) return setFormError("Please choose a transaction date.");
    const newTransaction: Transaction = { id: crypto.randomUUID(), title: title.trim(), amount: Number(parsedAmount.toFixed(2)), category, date, type };
    setTransactions((current) => [newTransaction, ...current]);
    resetForm();
  }
  function deleteTransaction(id: string) {
    setTransactions((current) => current.filter((item) => item.id !== id));
  }
  function loadDemoData() {
    setTransactions(sampleTransactions);
    setMonthlyBudget(800);
    setSavingsGoal(2000);
    setFormError("");
  }
  function clearAllData() {
    setTransactions([]);
    localStorage.removeItem("fin-assist-transactions");
    setFormError("");
  }
  function exportReport() {
    downloadTextFile(
      "fin-assist-report.json",
      JSON.stringify({ exportedAt: new Date().toISOString(), monthlyBudget, savingsGoal, healthScore: healthScore.score, rating: healthScore.rating, prediction, totals, transactions: sortedTransactions }, null, 2),
      "application/json"
    );
  }

  const availableCategories = type === "expense" ? expenseCategories : incomeCategories;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Final Year Project</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Fin Assist</h1>
              <p className="mt-3 max-w-3xl text-slate-300">An intelligent personal finance assistant that tracks transactions, predicts overspending risk, scores financial health, and produces behaviour-aware spending recommendations from real user data.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <button onClick={loadDemoData} className="rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:opacity-90">Load demo data</button>
              <button onClick={clearAllData} className="rounded-2xl border border-white/15 px-4 py-3 font-semibold transition hover:bg-white/5">Clear transactions</button>
              <button onClick={exportReport} className="rounded-2xl border border-white/15 px-4 py-3 font-semibold transition hover:bg-white/5">Export report</button>
              <button onClick={() => window.print()} className="rounded-2xl border border-white/15 px-4 py-3 font-semibold transition hover:bg-white/5">Print dashboard</button>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Total Income" value={formatCurrency(totals.allIncome)} description="All recorded income" />
          <SummaryCard title="Total Expenses" value={formatCurrency(totals.allExpenses)} description="All recorded expenses" />
          <SummaryCard title="Current Balance" value={formatCurrency(totals.balance)} description="Income minus expenses" />
          <SummaryCard title="Savings Goal" value={`${totals.goalProgress.toFixed(0)}%`} description={`${formatCurrency(Math.max(totals.balance, 0))} saved`} />
        </section>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          <MetricCard title="This Month's Spend" value={formatCurrency(totals.currentMonthExpenses)} subtitle={`${formatCurrency(totals.budgetRemaining)} budget remaining`} />
          <MetricCard title="Projected Spend" value={formatCurrency(prediction.projectedMonthlySpend)} subtitle={`${prediction.risk} overspending risk`} />
          <MetricCard title="Daily Spend Rate" value={formatCurrency(prediction.averageDailySpend)} subtitle="Average per day this month" />
          <MetricCard title="Safe Daily Limit" value={formatCurrency(prediction.safeDailyAllowance)} subtitle={`${daysRemaining} days remaining`} />
          <MetricCard title="Health Score" value={`${healthScore.score}/100`} subtitle={`${healthScore.rating} financial health`} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Add transaction</h2>
                <p className="text-sm text-slate-300">Track income and expenses with validation and local persistence.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2"><span className="text-sm text-slate-300">Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Grocery shopping" className="field" /></label>
              <label className="space-y-2"><span className="text-sm text-slate-300">Amount (£)</span><input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 45" type="number" min="0" step="0.01" className="field" /></label>
              <label className="space-y-2"><span className="text-sm text-slate-300">Type</span><select value={type} onChange={(e) => setType(e.target.value as TransactionType)} className="field"><option value="expense">Expense</option><option value="income">Income</option></select></label>
              <label className="space-y-2"><span className="text-sm text-slate-300">Category</span><select value={category} onChange={(e) => setCategory(e.target.value)} className="field">{availableCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label className="space-y-2 md:col-span-2"><span className="text-sm text-slate-300">Date</span><input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="field" /></label>
            </div>
            {formError ? <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-100">{formError}</p> : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={addTransaction} className="rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:opacity-90">Save transaction</button>
              <button onClick={resetForm} className="rounded-2xl border border-white/15 px-5 py-3 font-semibold transition hover:bg-white/5">Reset form</button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold">Targets</h2>
              <p className="mt-1 text-sm text-slate-300">Set financial goals and compare them against current month behaviour.</p>
              <div className="mt-5 space-y-4">
                <label className="space-y-2"><span className="text-sm text-slate-300">Monthly budget (£)</span><input value={monthlyBudget} onChange={(e) => setMonthlyBudget(Number(e.target.value) || 0)} type="number" min="0" step="1" className="field" /></label>
                <label className="space-y-2"><span className="text-sm text-slate-300">Savings goal (£)</span><input value={savingsGoal} onChange={(e) => setSavingsGoal(Number(e.target.value) || 0)} type="number" min="0" step="1" className="field" /></label>
              </div>
              <div className="mt-6 rounded-2xl bg-slate-900/80 p-4">
                <div className="flex items-center justify-between text-sm text-slate-300"><span>Goal progress</span><span>{totals.goalProgress.toFixed(0)}%</span></div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${totals.goalProgress}%` }} /></div>
                <p className="mt-3 text-sm text-slate-300">Remaining to target: {formatCurrency(Math.max(savingsGoal - Math.max(totals.balance, 0), 0))}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Financial health score</h2>
                  <p className="mt-1 text-sm text-slate-300">A 0–100 score based on budget discipline, savings rate, and risk exposure.</p>
                </div>
                <div className="rounded-2xl bg-emerald-400/10 px-4 py-3 text-right"><p className="text-3xl font-bold text-emerald-300">{healthScore.score}</p><p className="text-xs uppercase tracking-[0.25em] text-emerald-200">{healthScore.rating}</p></div>
              </div>
              <div className="mt-5 space-y-3">{healthScore.breakdown.map((item) => <div key={`${item.label}-${item.detail}`} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><div className="flex items-center justify-between gap-4"><p className="font-medium">{item.label}</p><span className="text-sm text-slate-300">{item.impact === 0 ? "Stable" : `${item.impact}`}</span></div><p className="mt-2 text-sm text-slate-300">{item.detail}</p></div>)}</div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <InfoPanel title="Smart insights" description="Live analysis of current month activity and overall finances.">{insights.map((insight) => <MessageCard key={insight} tone="emerald">{insight}</MessageCard>)}</InfoPanel>
          <InfoPanel title="Spending suggestions" description="Prescriptive recommendations derived from current data.">{spendingSuggestions.map((suggestion) => <MessageCard key={suggestion} tone="cyan">{suggestion}</MessageCard>)}</InfoPanel>
          <InfoPanel title="Anomaly detection" description="Highlights unusual movement against the previous month.">{spendingAnomalies.length === 0 ? <MessageCard tone="violet">No unusual category spikes were detected from the available data.</MessageCard> : spendingAnomalies.map((alert) => <MessageCard key={alert} tone="violet">{alert}</MessageCard>)}</InfoPanel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between"><div><h2 className="text-2xl font-semibold">Spending by category</h2><p className="mt-1 text-sm text-slate-300">Current month expense concentration.</p></div><span className="text-sm text-slate-300">{monthKey(today.toISOString())}</span></div>
            <div className="mt-6 space-y-4">{categoryBreakdown.length === 0 ? <p className="text-sm text-slate-300">No expense data yet for the current month.</p> : categoryBreakdown.map((item) => <div key={item.name} className="space-y-2"><div className="flex items-center justify-between text-sm"><span>{item.name}</span><span className="text-slate-300">{formatCurrency(item.value)} • {item.percentage.toFixed(0)}%</span></div><div className="h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${item.percentage}%` }} /></div></div>)}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold">Monthly trend</h2>
            <p className="mt-1 text-sm text-slate-300">Historical monthly income, expense, and net movement.</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10"><table className="min-w-full text-left text-sm"><thead className="bg-white/5 text-slate-300"><tr><th className="px-4 py-3">Month</th><th className="px-4 py-3">Income</th><th className="px-4 py-3">Expenses</th><th className="px-4 py-3">Net</th></tr></thead><tbody>{monthlyTrend.length === 0 ? <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-300">Add transactions to populate the monthly trend table.</td></tr> : monthlyTrend.map((row) => <tr key={row.monthStamp} className="border-t border-white/10"><td className="px-4 py-3">{row.month}</td><td className="px-4 py-3">{formatCurrency(row.income)}</td><td className="px-4 py-3">{formatCurrency(row.expense)}</td><td className={`px-4 py-3 ${row.net >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatCurrency(row.net)}</td></tr>)}</tbody></table></div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-semibold">Recent transactions</h2><p className="mt-1 text-sm text-slate-300">Latest recorded entries stored in browser local storage.</p></div><div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">{sortedTransactions.length} total transaction{sortedTransactions.length === 1 ? "" : "s"}</div></div>
          <div className="mt-4 space-y-3">{sortedTransactions.length === 0 ? <p className="text-sm text-slate-300">No transactions added yet.</p> : sortedTransactions.slice(0, 10).map((item) => <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{item.title}</p><p className="text-sm text-slate-300">{item.category} • {item.date} • {item.type}</p></div><div className="flex items-center gap-4"><p className={item.type === "income" ? "font-semibold text-emerald-300" : "font-semibold text-rose-300"}>{item.type === "income" ? "+" : "-"}{formatCurrency(item.amount)}</p><button onClick={() => deleteTransaction(item.id)} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5">Delete</button></div></div>)}</div>
        </section>
      </section>
    </main>
  );
}

function SummaryCard({ title, value, description }: { title: string; value: string; description: string }) {
  return <article className="rounded-3xl border border-white/10 bg-white/5 p-5"><p className="text-sm text-slate-300">{title}</p><h2 className="mt-3 text-3xl font-bold">{value}</h2><p className="mt-2 text-sm text-slate-400">{description}</p></article>;
}

function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-5"><p className="text-sm text-slate-300">{title}</p><h2 className="mt-3 text-2xl font-bold">{value}</h2><p className="mt-2 text-sm text-slate-400">{subtitle}</p></article>;
}

function InfoPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-6"><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-300">{description}</p><div className="mt-5 space-y-3">{children}</div></div>;
}

function MessageCard({ children, tone }: { children: React.ReactNode; tone: "emerald" | "cyan" | "violet" }) {
  const classNameByTone = { emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-50", cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-50", violet: "border-violet-400/20 bg-violet-400/10 text-violet-50" };
  return <div className={`rounded-2xl border p-4 text-sm ${classNameByTone[tone]}`}>{children}</div>;
}
