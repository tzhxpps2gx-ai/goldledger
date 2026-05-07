"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  TIME_RANGE_LABELS,
  filterTradesByRange,
  type TimeRange,
} from "@/lib/timeRanges";
import {
  calculateStats,
  buildEquityCurve,
  type Trade,
  type Stats,
} from "@/lib/calculations";
import { formatCurrency, formatDateTime, pnlColor, cn } from "@/lib/utils";
import EquityChart from "@/components/EquityChart";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  ChevronDown,
} from "lucide-react";

const TABS: TimeRange[] = ["today", "week", "month", "year", "all"];

export default function DashboardClient({
  trades,
  account,
}: {
  trades: Trade[];
  account: {
    name
