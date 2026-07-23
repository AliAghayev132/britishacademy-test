'use client'

import { FileText, Eye, Users, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

import { StatCard, Card } from '@/components/ui'

// Example static data — replace with a real analytics query.
const chartData = [
  { name: 'Mon', views: 120 },
  { name: 'Tue', views: 210 },
  { name: 'Wed', views: 180 },
  { name: 'Thu', views: 260 },
  { name: 'Fri', views: 320 },
  { name: 'Sat', views: 240 },
  { name: 'Sun', views: 300 },
]

const stats = [
  { title: 'Total Posts', value: '128', change: '+12%', changeType: 'positive', icon: <FileText className="h-5 w-5" /> },
  { title: 'Total Views', value: '48.2k', change: '+8%', changeType: 'positive', icon: <Eye className="h-5 w-5" /> },
  { title: 'Users', value: '2,340', change: '+3%', changeType: 'positive', icon: <Users className="h-5 w-5" /> },
  { title: 'Engagement', value: '64%', change: '-2%', changeType: 'negative', icon: <TrendingUp className="h-5 w-5" /> },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back — here is an overview of your workspace.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Chart */}
      <Card>
        <Card.Header>
          <Card.Title>Views this week</Card.Title>
          <Card.Description>A recharts area chart example.</Card.Description>
        </Card.Header>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#colorViews)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
