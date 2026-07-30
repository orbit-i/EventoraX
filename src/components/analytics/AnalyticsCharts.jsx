import './AnalyticsCharts.css'
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
    BarChart,
    Bar
} from "recharts";

import { userData, revenueData } from "./AnalyticsData";

function AnalyticsCharts() {
    return (
        <div className="analytics-chart-container">
            <div className="chart-card">
                <p className='revenue-growth-para'>Revenue Growth</p>
                <p>Gross Revenue comparison by month</p>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="current"
                            stroke='#3b82f6'
                            strokeWidth={1.5}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="previous"
                            stroke='#bdbdbd'
                            strokeWidth={1.5}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                        <Legend />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className='chart-card'>
                <p>User Acquisition</p>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={userData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        />
                        <YAxis 
                        axisLine={false}
                        tickLine={false}
                        />
                        <Tooltip />
                        <Bar dataKey="users"
                        fill='#22c55e'
                        radius={[5,5,0,0]}
                        />

                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export default AnalyticsCharts
