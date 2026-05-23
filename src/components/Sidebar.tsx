import { memo } from 'react';
import { LayoutDashboard, Upload, BarChart3, Settings, HelpCircle, LogOut, Database } from 'lucide-react';

const Sidebar = memo(function Sidebar() {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Upload, label: 'Upload Data', active: false },
    { icon: BarChart3, label: 'Analytics', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ];

  const bottomItems = [
    { icon: HelpCircle, label: 'Help' },
    { icon: LogOut, label: 'Logout' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#0A1628] flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
          <Database size={18} className="text-teal-400" />
        </div>
        <span className="text-white font-bold text-[15px] tracking-tight">InfluencerDB</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
              item.active
                ? 'bg-white/[0.08] text-white border-l-[3px] border-teal-500'
                : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-300 border-l-[3px] border-transparent'
            }`}
            onClick={() => {
              if (!item.active) {
                // Coming soon tooltip behavior
              }
            }}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        {bottomItems.map(item => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium text-gray-400 hover:bg-white/[0.04] hover:text-gray-300 transition-colors"
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </div>
    </aside>
  );
});

export default Sidebar;
