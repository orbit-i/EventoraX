import './RevenueGrowth.css'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts"

const revenueData = [
    { month: "MAR", revenue: 350000 },
    { month: "APR", revenue: 470000 },
    { month: "MAY", revenue: 430000 },
    { month: "JUN", revenue: 620000 },
    { month: "JUL", revenue: 710000 },
    { month: "AUG", revenue: 850000 }
];


function RevenueGrowth() {
    return (
        <div className='revenue-growth-main-container'>
            <div className='revenue-growth-container'>
                <div className='revenue-growth-header'>
                    <p className='revenue-growth-para'>Revenue Growth</p>
                    <button>
                        Last 6 months
                    </button>
                </div>
                <div className='revenue-chart-container'>
                    <ResponsiveContainer width="90%" height="90%">
                        <LineChart data={revenueData}>
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                padding={{ left: 20, right: 20 }}
                            />
                            <YAxis hide />

                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke='#4f46e5'
                                strokeWidth={1.5}
                                dot={{ r: 4 }}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            {/* plan distribution container */}
            <div className='plan-distribution-container'>
                
            </div>
        </div>
    )
}

export default RevenueGrowth
