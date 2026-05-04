"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function EquityChart({
  data,
}: {
  data: { date: string; balance: number }[];
}) {
  return (
    <div className="w-full h-56 md:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#26262B" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#52525B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#52525B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A1A1F",
              border: "1px solid #26262B",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#A1A1AA" }}
            itemStyle={{ color: "#D4AF37" }}
            formatter={(value: number) => [
              new Intl.NumberFormat("de-DE", {
                style: "currency",
                currency: "EUR",
              }).format(value),
              "Saldo",
            ]}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#D4AF37"
            strokeWidth={2}
            fill="url(#goldGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
