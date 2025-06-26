import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { InvestmentComparison } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ComparisonChartProps {
  data: InvestmentComparison[];
  customRate: number;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ data, customRate }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{`Année ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
        Évolution de votre capital sur {data.length - 1} ans
      </h3>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="year" 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              label={{ value: 'Années', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
              label={{ value: 'Capital (€)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="livretA"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Livret A (3%)"
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="custom"
              stroke="#10b981"
              strokeWidth={3}
              name={`Placement personnalisé (${customRate}%)`}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="inflation"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Seuil inflation (2%)"
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-amber-50 rounded-lg">
          <div className="w-4 h-4 bg-amber-500 mx-auto mb-2 rounded"></div>
          <p className="text-sm font-medium text-amber-800">Livret A</p>
          <p className="text-xs text-amber-600">Taux garanti 3%</p>
        </div>
        <div className="text-center p-4 bg-emerald-50 rounded-lg">
          <div className="w-4 h-4 bg-emerald-500 mx-auto mb-2 rounded"></div>
          <p className="text-sm font-medium text-emerald-800">Votre placement</p>
          <p className="text-xs text-emerald-600">Taux {customRate}%</p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="w-4 h-4 bg-red-500 mx-auto mb-2 rounded"></div>
          <p className="text-sm font-medium text-red-800">Seuil inflation</p>
          <p className="text-xs text-red-600">Impact inflation 2%</p>
        </div>
      </div>
    </div>
  );
};

export default ComparisonChart;