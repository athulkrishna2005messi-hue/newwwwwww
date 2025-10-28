'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { DashboardMetrics } from '@/types/dashboard';

interface ChartsProps {
  metrics: DashboardMetrics;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#22c55e',
  neutral: '#94a3b8',
  negative: '#ef4444'
};

export function DashboardCharts({ metrics }: ChartsProps) {
  const pieData = metrics.sentimentDistribution.map((item) => ({
    name: item.sentiment,
    value: item.value
  }));

  const lineData = metrics.volumeOverTime.map((item) => ({
    date: item.date,
    count: item.count
  }));

  const barData = metrics.topTags.map((item) => ({
    tag: item.tag,
    count: item.count
  }));

  return (
    <div className="dashboard-grid">
      <div className="card chart-card chart-card-third">
        <h3 className="section-title" style={{ marginTop: 0 }}>
          Sentiment Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
              {pieData.map((entry, index) => (
                <Cell key={index} fill={SENTIMENT_COLORS[entry.name] ?? '#2563eb'} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card chart-card-half">
        <h3 className="section-title" style={{ marginTop: 0 }}>
          Volume Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card chart-card-half">
        <h3 className="section-title" style={{ marginTop: 0 }}>
          Top Tags & Pain Points
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tag" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={80} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
