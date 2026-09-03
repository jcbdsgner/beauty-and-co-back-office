import type { Metadata } from "next";
import PageHeader from "@/components/back-office/PageHeader";
import StatCards from "@/components/back-office/StatCards";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import { analyticsKpis, salesByChannel, topCountries } from "@/lib/mock";

export const metadata: Metadata = { title: "Analytics | Homonyme" };

function BarList({ title, data }: { title: string; data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="mb-4 text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>
      <ul className="space-y-3">
        {data.map((d) => (
          <li key={d.label}>
            <div className="mb-1 flex justify-between text-theme-sm">
              <span className="text-gray-600 dark:text-gray-300">{d.label}</span>
              <span className="text-gray-400">{d.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-white/5">
              <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(d.value / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Traffic, conversion and revenue trends." />
      <StatCards items={analyticsKpis} />
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
        <MonthlySalesChart />
        <StatisticsChart />
      </div>
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
        <BarList title="Sales by channel" data={salesByChannel} />
        <BarList title="Top countries" data={topCountries} />
      </div>
    </div>
  );
}
