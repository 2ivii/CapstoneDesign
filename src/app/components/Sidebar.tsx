import { Link, useLocation } from "react-router";
import { Camera, Target, Calendar, MessageSquare, TrendingUp, CheckSquare } from "lucide-react";

export function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { id: "f1", label: "성적표 촬영", icon: Camera, path: "/", badge: "진행중" },
    { id: "f1-1", label: "틀린 문항 정밀 체크", icon: CheckSquare, path: "/answer-marking" },
    { id: "f2", label: "취약영역 분석", icon: Target, path: "/analysis" },
    { id: "f3", label: "AI 학습 플래닝", icon: Calendar, path: "/ai-planner" },
    { id: "f4", label: "AI 문제풀이 챗봇", icon: MessageSquare, path: "/ai-chatbot" },
  ];

  return (
    <div className="w-64 bg-[#2C3E37] h-screen flex flex-col text-white">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg">러너스하이</h1>
            <p className="text-xs text-white/60">Runner's High AI</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm flex-1">{item.label}</span>
                {item.badge && isActive && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <span className="text-sm">이</span>
          </div>
          <div className="text-sm">
            <p className="text-white/90">이민우</p>
            <p className="text-xs text-white/50">고등학생 3학년</p>
          </div>
        </div>
      </div>
    </div>
  );
}
