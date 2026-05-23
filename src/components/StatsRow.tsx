import { memo, useMemo } from 'react';
import { Users, CheckCircle, Star, Eye, Crown, TrendingUp, UserCheck, User, UserMinus, Gem } from 'lucide-react';
import type { Influencer } from '@/types/influencer';
import { formatNumber, getFollowerTier, FOLLOWER_TIER_CONFIG } from '@/utils/formatters';

interface StatsRowProps {
  influencers: Influencer[];
  approvedIds: Set<string>;
}

const StatsRow = memo(function StatsRow({ influencers, approvedIds }: StatsRowProps) {
  const totalInfluencers = influencers.length;
  const approvedCount = influencers.filter(i => approvedIds.has(i.id)).length;
  const avgScore = totalInfluencers > 0
    ? (influencers.reduce((sum, i) => sum + i.totalScore, 0) / totalInfluencers).toFixed(1)
    : '0';
  const avgAudience = totalInfluencers > 0
    ? Math.round(influencers.reduce((sum, i) => sum + i.audienceSize, 0) / totalInfluencers)
    : 0;

  // Compute audience tier counts from the currently displayed (filtered) influencers
  const audienceTiers = useMemo(() => {
    const counts = { huge: 0, mega: 0, medium: 0, small: 0, micro: 0, nano: 0 };
    influencers.forEach(i => {
      const tier = getFollowerTier(i.audienceSize);
      counts[tier]++;
    });
    return counts;
  }, [influencers]);

  const mainStats = [
    { label: 'Total Influencers', value: totalInfluencers.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Approved', value: approvedCount.toString(), icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Avg. Total Score', value: avgScore, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Avg. Audience', value: formatNumber(avgAudience), icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  // Tier KPI data with config colors
  const tierKpis: { key: string; icon: typeof Crown }[] = [
    { key: 'huge', icon: Gem },
    { key: 'mega', icon: Crown },
    { key: 'medium', icon: TrendingUp },
    { key: 'small', icon: UserCheck },
    { key: 'micro', icon: User },
    { key: 'nano', icon: UserMinus },
  ];

  return (
    <div className="px-4 sm:px-6 py-4 max-w-[1400px] mx-auto space-y-3">
      {/* Row 1: High Level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {mainStats.map(stat => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium truncate">{stat.label}</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Audience Tier KPIs (Huge, Mega, Medium, Small, Micro, Nano) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {tierKpis.map(({ key, icon: Icon }) => {
          const config = FOLLOWER_TIER_CONFIG[key];
          const value = audienceTiers[key as keyof typeof audienceTiers].toString();
          return (
            <div
              key={key}
              className="relative bg-white rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 transition-shadow hover:shadow-md"
              style={{ borderWidth: 2, borderColor: config.dotColor }}
              title={config.range}
            >
              {/* Colored dot in top right */}
              <span
                className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: config.dotColor }}
              />
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: config.dotColor + '18' }}
              >
                <Icon size={14} className="sm:hidden" style={{ color: config.dotColor }} />
                <Icon size={16} className="hidden sm:block" style={{ color: config.dotColor }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">{config.label}</p>
                <p className="text-base sm:text-lg font-bold text-gray-800">{value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default StatsRow;
