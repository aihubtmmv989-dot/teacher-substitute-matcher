import React from 'react';
import {
  LayoutDashboard,
  UserX,
  Sparkles,
  CalendarDays,
  Printer,
  Settings,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';

export type NavigationTab = 'dashboard' | 'absences' | 'matcher' | 'timetable' | 'print' | 'admin';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  absentCountToday: number;
  unresolvedReliefCount: number;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
  schoolName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  absentCountToday,
  unresolvedReliefCount,
  isOpenMobile,
  onToggleMobile,
  schoolName,
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number; badgeAlert?: boolean }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'absences',
      label: 'Mark Absence',
      icon: <UserX className="w-5 h-5" />,
      badge: absentCountToday > 0 ? absentCountToday : undefined,
    },
    {
      id: 'matcher',
      label: 'Substitute Matcher',
      icon: <Sparkles className="w-5 h-5" />,
      badge: unresolvedReliefCount > 0 ? unresolvedReliefCount : undefined,
      badgeAlert: unresolvedReliefCount > 0,
    },
    {
      id: 'timetable',
      label: 'Master Timetable',
      icon: <CalendarDays className="w-5 h-5" />,
    },
    {
      id: 'print',
      label: 'Print Relief Sheet',
      icon: <Printer className="w-5 h-5" />,
    },
    {
      id: 'admin',
      label: 'Admin & Timetable',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden print:hidden bg-slate-900 text-white flex items-center justify-between px-4 py-3 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-tight text-white">Teacher Substitute Matcher</h1>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">{schoolName}</p>
          </div>
        </div>
        <button
          id="mobile-menu-toggle-btn"
          type="button"
          onClick={onToggleMobile}
          className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
          aria-label="Toggle Navigation"
        >
          {isOpenMobile ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggleMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 print:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight text-white">Teacher Substitute Matcher</h2>
              <span className="inline-block text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 mt-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                School Relief Portal
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/60">
            <p className="text-xs text-slate-400 truncate font-medium">{schoolName}</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (isOpenMobile) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      item.badgeAlert
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : isActive
                        ? 'bg-indigo-700 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Deterministic Rules Engine</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
            Zero conflict guarantee: busy teachers are never assigned.
          </p>
        </div>
      </aside>
    </>
  );
};
