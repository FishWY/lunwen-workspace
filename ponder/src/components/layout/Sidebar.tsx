import { useEffect, useState } from 'react';
import { Home, Brain, MessageSquare, Box, User, Settings, ChevronLeft, ChevronRight, Zap, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getSessionsMetadata } from '../../utils/sessionDB';

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Brain, label: 'Think', path: '/workspace' },
        { icon: MessageSquare, label: 'Chat', path: '/chat' },
        { icon: Box, label: 'Space', path: '/space' },
    ];

    const [recent, setRecent] = useState<{ id: string; title: string; lastModified: number }[]>([]);

    useEffect(() => {
        (async () => {
            const list = await getSessionsMetadata();
            setRecent(list.slice(0, 10));
        })();
    }, [location.pathname]);

    return (
        <div
            className={`h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                {!collapsed && (
                    <span className="font-serif text-xl font-bold text-gray-800">Ponder</span>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-3 py-2 rounded-xl transition-colors ${isActive
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon size={20} />
                            {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Recent Thoughts */}
            {!collapsed && (
                <div className="px-3 py-2">
                    <div className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        <Clock size={14} className="mr-2" /> Recent Thoughts
                    </div>
                    <div className="space-y-1">
                        {recent.length === 0 ? (
                            <div className="text-xs text-gray-400 px-2 py-1">No sessions yet</div>
                        ) : (
                            recent.map((s) => (
                                <Link
                                    key={s.id}
                                    to={`/workspace/${s.id}`}
                                    className="block px-2 py-1 rounded-lg text-sm text-gray-700 hover:bg-gray-50 truncate"
                                    title={s.title}
                                >
                                    {s.title}
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 space-y-2">
                {!collapsed && (
                    <button className="w-full flex items-center justify-center px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors">
                        <Zap size={16} className="mr-2" />
                        <span className="text-sm font-medium">Upgrade</span>
                    </button>
                )}

                <div className="flex items-center px-2 py-2 text-gray-500 hover:text-gray-900 cursor-pointer rounded-xl hover:bg-gray-50">
                    <User size={20} />
                    {!collapsed && <span className="ml-3 text-sm font-medium">Profile</span>}
                </div>
                <div className="flex items-center px-2 py-2 text-gray-500 hover:text-gray-900 cursor-pointer rounded-xl hover:bg-gray-50">
                    <Settings size={20} />
                    {!collapsed && <span className="ml-3 text-sm font-medium">Settings</span>}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
