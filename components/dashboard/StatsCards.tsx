import {
  Users,
  UserPlus,
  MessageCircle,
  Building2,
} from "lucide-react";

const stats = [
  {
    label: "Connections",
    icon: Users,
  },
  {
    label: "Pending Requests",
    icon: UserPlus,
  },
  {
    label: "Messages",
    icon: MessageCircle,
  },
  
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-100 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-medium text-slate-400">
                  {stat.label}
                </p>

                <div className="mt-2 h-7 w-12 animate-pulse rounded-md bg-slate-100" />
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                <Icon className="h-5 w-5 text-indigo-600" />
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}
