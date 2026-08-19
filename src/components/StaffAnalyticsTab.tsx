import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
} from 'recharts';
import { motion } from 'motion/react';
import { Order } from '../types';
import { formatPrice, toPersianDigits } from '../utils/formatters';

interface StaffAnalyticsTabProps {
  orders: Order[];
}

interface HourlyData {
  hour: number;
  hourLabel: string;
  orderCount: number;
  revenue: number;
  deliveredCount: number;
}

// Convert any Persian/Arabic digits in strings to English
function parseHourFromCreatedAt(createdAtStr: string): number {
  if (!createdAtStr) return new Date().getHours();

  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let cleanStr = createdAtStr;
  for (let i = 0; i < 10; i++) {
    cleanStr = cleanStr.replaceAll(persianDigits[i], i.toString()).replaceAll(arabicDigits[i], i.toString());
  }

  const timeMatch = cleanStr.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const h = parseInt(timeMatch[1], 10);
    if (!isNaN(h) && h >= 0 && h <= 23) return h;
  }

  const dateObj = new Date(cleanStr);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.getHours();
  }

  return new Date().getHours();
}

export const StaffAnalyticsTab: React.FC<StaffAnalyticsTabProps> = ({ orders }) => {
  const [viewMode, setViewMode] = useState<'cafe_hours' | 'full_day'>('cafe_hours');
  const [metricView, setMetricView] = useState<'both' | 'orders_only' | 'revenue_only'>('both');

  // Compute hourly aggregation
  const hourlyData = useMemo<HourlyData[]>(() => {
    // Determine hour ranges: 8 to 23 for cafe hours, or 0 to 23 for full day
    const startHour = viewMode === 'cafe_hours' ? 8 : 0;
    const endHour = 23;

    const hourMap: Record<number, { count: number; revenue: number; delivered: number }> = {};
    for (let h = startHour; h <= endHour; h++) {
      hourMap[h] = { count: 0, revenue: 0, delivered: 0 };
    }

    // Process actual orders
    orders.forEach((order) => {
      const h = parseHourFromCreatedAt(order.createdAt);
      if (hourMap[h]) {
        hourMap[h].count += 1;
        hourMap[h].revenue += order.total || 0;
        if (order.status === 'delivered') {
          hourMap[h].delivered += 1;
        }
      } else if (viewMode === 'cafe_hours' && h < 8) {
        // Map early morning to earliest slot or keep track
        hourMap[8].count += 1;
        hourMap[8].revenue += order.total || 0;
      }
    });

    const result: HourlyData[] = [];
    for (let h = startHour; h <= endHour; h++) {
      const label = `${toPersianDigits(h.toString().padStart(2, '0'))}:۰۰`;
      result.push({
        hour: h,
        hourLabel: label,
        orderCount: hourMap[h].count,
        revenue: hourMap[h].revenue,
        deliveredCount: hourMap[h].delivered,
      });
    }

    return result;
  }, [orders, viewMode]);

  // Compute insights
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const peakHourData = useMemo(() => {
    if (hourlyData.length === 0) return null;
    let peak = hourlyData[0];
    hourlyData.forEach((item) => {
      if (item.orderCount > peak.orderCount) {
        peak = item;
      }
    });
    return peak.orderCount > 0 ? peak : null;
  }, [hourlyData]);

  const activeHoursCount = hourlyData.filter((d) => d.orderCount > 0).length || 1;
  const avgOrdersPerHour = totalOrders > 0 ? (totalOrders / activeHoursCount).toFixed(1) : '۰';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161d18] border border-[#564334]/20 rounded-2xl p-4 md:p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FFD700] text-2xl">show_chart</span>
            <h3 className="text-lg font-bold text-[#FDFAE7]">تحلیل و آمار سفارشات در ساعات روز</h3>
          </div>
          <p className="text-xs text-[#ddc1ae] mt-1">
            نمودار خطی هوشمند بررسی تراکم و ساعات اوج سفارشات کافه زیتون
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Span Toggle */}
          <div className="bg-[#1D2F22] p-1 rounded-xl flex items-center gap-1 border border-[#564334]/30">
            <button
              onClick={() => setViewMode('cafe_hours')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'cafe_hours'
                  ? 'bg-[#FFD700] text-[#1D2F22] shadow-sm'
                  : 'text-[#ddc1ae] hover:text-[#FDFAE7]'
              }`}
            >
              ساعات کاری (۸ الی ۲۴)
            </button>
            <button
              onClick={() => setViewMode('full_day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'full_day'
                  ? 'bg-[#FFD700] text-[#1D2F22] shadow-sm'
                  : 'text-[#ddc1ae] hover:text-[#FDFAE7]'
              }`}
            >
              ۲۴ ساعت کامل
            </button>
          </div>

          {/* Metric View Toggle */}
          <div className="bg-[#1D2F22] p-1 rounded-xl flex items-center gap-1 border border-[#564334]/30 text-xs">
            <button
              onClick={() => setMetricView('both')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                metricView === 'both' ? 'bg-[#FF8C00] text-[#0e1510] font-bold' : 'text-[#ddc1ae]'
              }`}
            >
              سفارش + فروش
            </button>
            <button
              onClick={() => setMetricView('orders_only')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                metricView === 'orders_only' ? 'bg-[#FF8C00] text-[#0e1510] font-bold' : 'text-[#ddc1ae]'
              }`}
            >
              فقط تعداد
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#161d18] border border-[#564334]/20 rounded-2xl p-4">
          <div className="flex items-center justify-between text-[#ddc1ae] text-xs">
            <span>مجموع سفارشات</span>
            <span className="material-symbols-outlined text-base text-[#FFD700]">shopping_bag</span>
          </div>
          <div className="text-2xl font-bold text-[#FDFAE7] mt-2">
            {toPersianDigits(totalOrders)}{' '}
            <span className="text-xs font-normal text-[#ddc1ae]">سفارش</span>
          </div>
          <p className="text-[11px] text-[#ddc1ae]/70 mt-1">کل موارد ثبت‌شده امروز</p>
        </div>

        <div className="bg-[#161d18] border border-[#564334]/20 rounded-2xl p-4">
          <div className="flex items-center justify-between text-[#ddc1ae] text-xs">
            <span>ساعت اوج سفارشات</span>
            <span className="material-symbols-outlined text-base text-[#FF8C00]">local_fire_department</span>
          </div>
          <div className="text-2xl font-bold text-[#FF8C00] mt-2">
            {peakHourData ? peakHourData.hourLabel : '---'}
          </div>
          <p className="text-[11px] text-[#ddc1ae]/70 mt-1">
            {peakHourData
              ? `بیشترین ترافیک (${toPersianDigits(peakHourData.orderCount)} سفارش)`
              : 'هنوز ثبتی انجام نشده'}
          </p>
        </div>

        <div className="bg-[#161d18] border border-[#564334]/20 rounded-2xl p-4">
          <div className="flex items-center justify-between text-[#ddc1ae] text-xs">
            <span>میانگین در ساعت فعال</span>
            <span className="material-symbols-outlined text-base text-amber-400">timelapse</span>
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {toPersianDigits(avgOrdersPerHour)}{' '}
            <span className="text-xs font-normal text-[#ddc1ae]">سفارش/ساعت</span>
          </div>
          <p className="text-[11px] text-[#ddc1ae]/70 mt-1">نرخ جریان کاری پرسنل</p>
        </div>

        <div className="bg-[#161d18] border border-[#564334]/20 rounded-2xl p-4">
          <div className="flex items-center justify-between text-[#ddc1ae] text-xs">
            <span>مجموع فروش ثبت‌شده</span>
            <span className="material-symbols-outlined text-base text-emerald-400">payments</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-400 mt-2 truncate">
            {formatPrice(totalRevenue)}
          </div>
          <p className="text-[11px] text-[#ddc1ae]/70 mt-1">کل فاکتورهای صادره</p>
        </div>
      </div>

      {/* Main Recharts Line Chart */}
      <div className="bg-[#161d18] border border-[#564334]/20 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FFD700] animate-pulse" />
            <h4 className="font-bold text-sm md:text-base text-[#FDFAE7]">
              نمودار خطی پراکندگی سفارشات بر حسب ساعت
            </h4>
          </div>
          <span className="text-xs text-[#ddc1ae]/70">محور افقی: ساعت | محور عمودی: تعداد</span>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-[320px] md:h-[380px] pt-4" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={hourlyData}
              margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
            >
              <defs>
                <linearGradient id="orderCountGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FFD700" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FF8C00" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#343b35"
                strokeOpacity={0.4}
                vertical={false}
              />

              <XAxis
                dataKey="hourLabel"
                stroke="#8d998f"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#343b35' }}
                dy={10}
              />

              <YAxis
                stroke="#8d998f"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#343b35' }}
                allowDecimals={false}
                dx={-4}
                tickFormatter={(val) => toPersianDigits(val)}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as HourlyData;
                    return (
                      <div
                        className="bg-[#1D2F22] border border-[#FFD700]/50 p-3.5 rounded-xl shadow-2xl text-right font-vazir"
                        dir="rtl"
                      >
                        <p className="text-xs font-bold text-[#FFD700] mb-1.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          <span>ساعت {data.hourLabel}</span>
                        </p>
                        <div className="space-y-1 text-xs text-[#FDFAE7]">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[#ddc1ae]">تعداد سفارشات:</span>
                            <span className="font-bold text-[#FFD700]">
                              {toPersianDigits(data.orderCount)} عدد
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[#ddc1ae]">مجموع فروش:</span>
                            <span className="font-bold text-emerald-400">
                              {formatPrice(data.revenue)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[#ddc1ae]">تحویل‌شده:</span>
                            <span className="font-bold text-sky-400">
                              {toPersianDigits(data.deliveredCount)} عدد
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend
                wrapperStyle={{ paddingTop: '15px' }}
                formatter={(value) => {
                  if (value === 'orderCount') return <span className="text-xs font-medium text-[#FFD700] mr-2">تعداد سفارشات (عدد)</span>;
                  if (value === 'deliveredCount') return <span className="text-xs font-medium text-emerald-400 mr-2">سفارشات تحویل‌شده</span>;
                  return value;
                }}
              />

              {/* Primary Line: Orders Count */}
              {(metricView === 'both' || metricView === 'orders_only') && (
                <Line
                  type="monotone"
                  dataKey="orderCount"
                  name="orderCount"
                  stroke="#FFD700"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#FFD700', stroke: '#161d18', strokeWidth: 2 }}
                  activeDot={{
                    r: 7,
                    fill: '#FF8C00',
                    stroke: '#FDFAE7',
                    strokeWidth: 2,
                  }}
                  isAnimationActive={true}
                  animationDuration={1200}
                />
              )}

              {/* Secondary Line: Delivered Orders */}
              {metricView === 'both' && (
                <Line
                  type="monotone"
                  dataKey="deliveredCount"
                  name="deliveredCount"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#10b981', stroke: '#161d18', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#FDFAE7', strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={1200}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Detail Breakdown Table */}
      <div className="bg-[#161d18] border border-[#564334]/20 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">
        <h4 className="font-bold text-sm text-[#FDFAE7] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#FFD700]">table_rows</span>
          <span>جدول جزئیات ترافیک کاری به تفکیک ساعت</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {hourlyData.map((slot) => {
            const isPeak = peakHourData && peakHourData.hour === slot.hour && slot.orderCount > 0;
            const hasOrders = slot.orderCount > 0;
            return (
              <div
                key={slot.hour}
                className={`p-3 rounded-xl border transition-all ${
                  isPeak
                    ? 'bg-[#FF8C00]/15 border-[#FF8C00] shadow-sm'
                    : hasOrders
                    ? 'bg-[#1D2F22]/70 border-[#FFD700]/30'
                    : 'bg-[#1a211c]/50 border-[#564334]/15 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#ddc1ae]">{slot.hourLabel}</span>
                  {isPeak && (
                    <span className="text-[10px] bg-[#FF8C00] text-[#0e1510] font-bold px-1.5 py-0.2 rounded-full">
                      اوج
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="text-base font-bold text-[#FDFAE7]">
                    {toPersianDigits(slot.orderCount)}
                  </span>
                  <span className="text-[10px] text-[#ddc1ae]">سفارش</span>
                </div>
                {slot.revenue > 0 && (
                  <div className="mt-1 text-[10px] text-emerald-400 font-medium truncate">
                    {formatPrice(slot.revenue)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
