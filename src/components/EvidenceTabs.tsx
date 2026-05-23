import { useState, memo } from 'react';
import { Star, Target, Users, Award, Handshake } from 'lucide-react';
import { hasContent } from '@/utils/validators';

interface EvidenceTabsProps {
  contentFit: number;
  audienceEngagement: number;
  authorityOpinion: number;
  accessPartnership: number;
  contentFitEvidence: string;
  audienceEngagementEvidence: string;
  authorityOpinionEvidence: string;
  accessPartnershipEvidence: string;
}

type TabKey = 'content' | 'audience' | 'authority' | 'access';

const EvidenceTabs = memo(function EvidenceTabs({
  contentFit,
  audienceEngagement,
  authorityOpinion,
  accessPartnership,
  contentFitEvidence,
  audienceEngagementEvidence,
  authorityOpinionEvidence,
  accessPartnershipEvidence,
}: EvidenceTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('content');

  const tabs: { key: TabKey; label: string; shortLabel: string; score: number; evidence: string; icon: typeof Star; iconColor: string }[] = [
    { key: 'content', label: 'Content Fit', shortLabel: 'Content', score: contentFit, evidence: contentFitEvidence, icon: Target, iconColor: '#F59E0B' },
    { key: 'audience', label: 'Audience & Engagement', shortLabel: 'Audience', score: audienceEngagement, evidence: audienceEngagementEvidence, icon: Users, iconColor: '#3B82F6' },
    { key: 'authority', label: 'Authority & Opinion', shortLabel: 'Authority', score: authorityOpinion, evidence: authorityOpinionEvidence, icon: Award, iconColor: '#8B5CF6' },
    { key: 'access', label: 'Access & Partnership', shortLabel: 'Access', score: accessPartnership, evidence: accessPartnershipEvidence, icon: Handshake, iconColor: '#10B981' },
  ];

  const activeTabData = tabs.find(t => t.key === activeTab)!;
  const hasEvidence = hasContent(activeTabData.evidence);

  return (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {tabs.map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-[12px] sm:text-[13px] font-medium transition-colors border-b-2 -mb-px whitespace-nowrap flex-1 justify-center ${
                isActive
                  ? 'text-gray-800 border-teal-500 bg-white'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TabIcon
                size={15}
                style={{ color: isActive ? tab.iconColor : '#9CA3AF' }}
              />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className={`ml-1 text-[11px] font-bold px-1.5 py-0.5 rounded ${
                isActive ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {tab.score}
              </span>
            </button>
          );
        })}
      </div>
      <div className="p-4">
        {hasEvidence ? (
          <div className="text-[13px] text-gray-600 leading-relaxed max-h-[200px] overflow-y-auto pr-2">
            {activeTabData.evidence.split('\n').map((p, i) => (
              <p key={i} className={i > 0 ? 'mt-2' : ''}>{p}</p>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-300 text-sm">{"\u2014"}</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default EvidenceTabs;
