import React, { useEffect, useState } from "react";
import { AnalyticsService, AnalyticsData } from "@/services/analyticsService";
import { useLanguage } from "@/components/common/LanguageContext";
import { TrendingUp, BarChart3, LineChart, PieChart, Info } from "lucide-react";

export default function AnalyticsTab() {
  const { t } = useLanguage();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const stats = await AnalyticsService.getAnalyticsData();
        setData(stats);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500 font-semibold">
        <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <span>Compiling platform analytics...</span>
      </div>
    );
  }

  if (!data) return null;

  // Custom SVG Bar Chart Renderer
  const SVGBarChart = ({ items, color = "#16a34a" }: { items: { label: string; value: number }[]; color?: string }) => {
    const maxVal = Math.max(...items.map(d => d.value), 1);
    const height = 150;
    const width = 400;
    const paddingLeft = 35;
    const paddingBottom = 25;
    const chartHeight = height - paddingBottom;
    const chartWidth = width - paddingLeft;
    const barWidth = Math.floor(chartWidth / items.length) - 10;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-48">
        {/* Y Axis line */}
        <line x1={paddingLeft} y1="5" x2={paddingLeft} y2={chartHeight} stroke="#e5e7eb" strokeWidth="1.5" />
        {/* X Axis line */}
        <line x1={paddingLeft} y1={chartHeight} x2={width - 5} y2={chartHeight} stroke="#e5e7eb" strokeWidth="1.5" />
        
        {items.map((item, idx) => {
          const barHeight = Math.floor((item.value / maxVal) * (chartHeight - 15));
          const x = paddingLeft + idx * (chartWidth / items.length) + 5;
          const y = chartHeight - barHeight;

          return (
            <g key={idx} className="group">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="3"
                className="transition-all duration-350 hover:opacity-85 cursor-pointer"
              />
              {/* Value Indicator label on hover */}
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize="9"
                fontWeight="extrabold"
                fill="#374151"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {item.value}
              </text>
              {/* Bottom Label text */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 14}
                textAnchor="middle"
                fontSize="8"
                fontWeight="semibold"
                fill="#9ca3af"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Custom SVG Line Chart Renderer
  const SVGLineChart = ({ items, color = "#2563eb" }: { items: { label: string; value: number }[]; color?: string }) => {
    const maxVal = Math.max(...items.map(d => d.value), 1);
    const height = 150;
    const width = 400;
    const paddingLeft = 35;
    const paddingBottom = 25;
    const chartHeight = height - paddingBottom;
    const chartWidth = width - paddingLeft;

    const points = items.map((item, idx) => {
      const x = paddingLeft + idx * (chartWidth / (items.length - 1 || 1));
      const y = chartHeight - (item.value / maxVal) * (chartHeight - 20);
      return { x, y, ...item };
    });

    const pathD = points.reduce((acc, p, idx) => 
      idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ""
    );

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-48">
        {/* Y Axis line */}
        <line x1={paddingLeft} y1="5" x2={paddingLeft} y2={chartHeight} stroke="#e5e7eb" strokeWidth="1.5" />
        {/* X Axis line */}
        <line x1={paddingLeft} y1={chartHeight} x2={width - 5} y2={chartHeight} stroke="#e5e7eb" strokeWidth="1.5" />

        {/* Chart Line path */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

        {points.map((p, idx) => (
          <g key={idx} className="group">
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="white"
              stroke={color}
              strokeWidth="2.5"
              className="cursor-pointer transition-all hover:r-6"
            />
            {/* Value text on hover */}
            <text
              x={p.x}
              y={p.y - 8}
              textAnchor="middle"
              fontSize="9"
              fontWeight="extrabold"
              fill="#374151"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {p.value}
            </text>
            {/* Axis Label */}
            <text
              x={p.x}
              y={chartHeight + 14}
              textAnchor="middle"
              fontSize="8"
              fontWeight="semibold"
              fill="#9ca3af"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  // Horizontal distribution rows (best responsive list representation instead of circle pie slice wrap breaks)
  const ProportionBar = ({ items }: { items: { label: string; value: number }[] }) => {
    const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
    return (
      <div className="space-y-4">
        {items.map((item, idx) => {
          const pct = Math.floor((item.value / total) * 100);
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                <span>{item.label}</span>
                <span>{item.value} ({pct}%)</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-green-700 h-full rounded-full" 
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* 1. User Registration Growth Line Chart */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-4">
        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <TrendingUp className="text-blue-600" size={18} />
          <span>User Registration Growth</span>
        </h4>
        <SVGLineChart items={data.userGrowth} color="#2563eb" />
      </div>

      {/* 2. Delivered Marketplace Revenue Trend Chart */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-4">
        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <LineChart className="text-green-600" size={18} />
          <span>Marketplace Delivered Revenue</span>
        </h4>
        <SVGLineChart items={data.marketplaceSales} color="#16a34a" />
      </div>

      {/* 3. Crop AI usage counts bar chart */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-4">
        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <BarChart3 className="text-emerald-700" size={18} />
          <span>Crop AI Diagnosed Crops</span>
        </h4>
        <SVGBarChart items={data.cropAnalysisUsage} color="#047857" />
      </div>

      {/* 4. Terrace sunlight distribution bar chart */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-4">
        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <BarChart3 className="text-rose-700" size={18} />
          <span>Terrace Sunlight Conditions</span>
        </h4>
        <SVGBarChart items={data.terraceAnalysisUsage} color="#be123c" />
      </div>

      {/* 5. Product categories distribution */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-4">
        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <PieChart className="text-purple-600" size={18} />
          <span>Product Category Share</span>
        </h4>
        <ProportionBar items={data.productCategories} />
      </div>

      {/* 6. Popular products */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-4">
        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <Info className="text-amber-500" size={18} />
          <span>Popular Products (Quantities Ordered)</span>
        </h4>
        <div className="space-y-3 pt-2">
          {data.popularProducts.map((prod, idx) => (
            <div key={idx} className="flex justify-between items-center border-b pb-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="bg-gray-100 text-gray-700 font-extrabold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="font-bold text-gray-800">{prod.label}</span>
              </div>
              <span className="bg-amber-50 text-amber-800 font-extrabold px-2.5 py-1 rounded-xl">
                {prod.value} items
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
