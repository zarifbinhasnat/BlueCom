import { NavLink, Outlet } from 'react-router-dom';
import {
    LayoutDashboard, Fish, Factory, FlaskConical, Package,
    Users, ClipboardList, Truck, BarChart3, ChevronUp,
    Droplets, Utensils, HeartPulse, Wallet
} from 'lucide-react';

const navItems = [
    { section: 'Overview' },
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { section: 'Management' },
    { to: '/species', icon: Fish, label: 'Species' },
    { to: '/farms', icon: Factory, label: 'Farms' },
    { to: '/tanks', icon: FlaskConical, label: 'Tanks' },
    { to: '/batches', icon: Package, label: 'Batches' },
    { section: 'Operations' },
    { to: '/water-logs', icon: Droplets, label: 'Water Logs' },
    { to: '/feeding-logs', icon: Utensils, label: 'Feeding Logs' },
    { to: '/health-logs', icon: HeartPulse, label: 'Health Logs' },
    { to: '/batch-financials', icon: Wallet, label: 'Batch Financials' },
    { section: 'Commercial' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/orders', icon: ClipboardList, label: 'Orders' },
    { to: '/shipments', icon: Truck, label: 'Shipments' },
    { section: 'Intelligence' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Layout() {
    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">B</div>
                    <span className="sidebar-brand">Bluecon</span>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item, i) => {
                        if (item.section) {
                            return <div key={i} className="sidebar-section-label">{item.section}</div>;
                        }
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/'}
                                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                            >
                                <Icon />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-avatar">ZH</div>
                    <div>
                        <div className="sidebar-user-name">Zarif Hasnat</div>
                        <div className="sidebar-user-role">Admin</div>
                    </div>
                    <ChevronUp style={{ marginLeft: 'auto', width: 16, height: 16 }} />
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
