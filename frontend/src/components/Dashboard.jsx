import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdRadar, MdBugReport, MdGpsFixed, MdCheckCircle } from 'react-icons/md';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Use relative path for production
const API_URL = '/api/backend';

const StatCard = ({ title, value, icon, color }) => (
    <div className="glass-panel p-6 rounded-xl flex items-center justify-between relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-400 text-sm font-mono">{title}</p>
            <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
            <span className={`text-2xl ${color}`}>{icon}</span>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_scans: 0,
        completed_scans: 0,
        failed_scans: 0,
        vulnerabilities_found: 0
    });
    const [loading, setLoading] = useState(true);

    const [recentAlerts, setRecentAlerts] = useState([]);
    const [activityData, setActivityData] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, vulnsRes, scansRes] = await Promise.all([
                    axios.get(`${API_URL}/stats`),
                    axios.get(`${API_URL}/vulnerabilities?limit=5`),
                    axios.get(`${API_URL}/scans?limit=50`)
                ]);

                setStats(statsRes.data);
                setRecentAlerts(vulnsRes.data);

                // Process scans for activity chart (Last 7 days)
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return {
                        date: d.toISOString().split('T')[0],
                        name: days[d.getDay()],
                        scans: 0
                    };
                });

                scansRes.data.forEach(scan => {
                    const scanDate = scan.created_at.split('T')[0];
                    const dayData = last7Days.find(d => d.date === scanDate);
                    if (dayData) {
                        dayData.scans += 1;
                    }
                });
                setActivityData(last7Days);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    return (
        <div className="flex flex-col gap-8 fade-in">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <MdRadar className="text-primary" />
                Command Center
            </h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="TOTAL SCANS"
                    value={loading ? '-' : stats.total_scans}
                    icon={<MdRadar />}
                    color="text-emerald-400"
                />
                <StatCard
                    title="TARGETS ANALYZED"
                    value={loading ? '-' : stats.completed_scans}
                    icon={<MdGpsFixed />}
                    color="text-blue-400"
                />
                <StatCard
                    title="VULNERABILITIES"
                    value={loading ? '-' : stats.vulnerabilities_found}
                    icon={<MdBugReport />}
                    color="text-red-400"
                />
                <StatCard
                    title="SUCCESS RATE"
                    value={loading ? '-' : `${stats.total_scans ? Math.round((stats.completed_scans / stats.total_scans) * 100) : 0}%`}
                    icon={<MdCheckCircle />}
                    color="text-yellow-400"
                />
            </div>

            {/* Activity Chart */}
            <div className="glass-panel p-6 rounded-xl border border-border-dark">
                <h3 className="text-lg font-medium text-white mb-6">Scan Activity (Last 7 Days)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>

                            <defs>
                                <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06f943" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#06f943" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#102315', borderColor: '#2f6a3e', color: '#fff' }}
                                itemStyle={{ color: '#06f943' }}
                            />
                            <Area type="monotone" dataKey="scans" stroke="#06f943" fillOpacity={1} fill="url(#colorScans)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-lg font-medium text-white mb-4">System Status</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-border-dark/50">
                            <span className="text-gray-400">Scanner Engine</span>
                            <span className="text-emerald-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> OPERATIONAL</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-border-dark/50">
                            <span className="text-gray-400">Database</span>
                            <span className="text-emerald-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> CONNECTED</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-border-dark/50">
                            <span className="text-gray-400">API Gateway</span>
                            <span className="text-emerald-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> ONLINE</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Celery Workers</span>
                            <span className="text-emerald-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> ACTIVE</span>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-lg font-medium text-white mb-4">Recent Alerts</h3>
                    <div className="space-y-3">
                        {recentAlerts.length > 0 ? (
                            recentAlerts.map(vuln => (
                                <div key={vuln.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3">
                                    <MdBugReport className="text-red-400 text-xl flex-shrink-0 mt-0.5" />
                                    <div className="overflow-hidden">
                                        <h4 className="text-red-300 font-medium text-sm truncate">
                                            {vuln.result?.title || "Vulnerability Detected"}
                                        </h4>
                                        <p className="text-xs text-gray-400 mt-1 truncate">Target: {vuln.target}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                <MdCheckCircle className="text-3xl mx-auto mb-2 opacity-50" />
                                No active threats detected
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
