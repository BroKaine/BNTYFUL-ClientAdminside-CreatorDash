import { memo } from 'react';
import { ChevronDown, ChevronUp, Globe, Mail, ExternalLink, Check, X, User, Eye, Lightbulb, FileText } from 'lucide-react';
import type { Influencer } from '@/types/influencer';
import { formatNumber, getTierColor, getFollowerTier, FOLLOWER_TIER_CONFIG } from '@/utils/formatters';
import { isValidUrl, displayValue, hasContent } from '@/utils/validators';
import ScoreBar from './ScoreBar';
import PlatformIcons from './PlatformIcons';
import PlatformLinksWithIcons from './PlatformLinksWithIcons';
import ApproveButton from './ApproveButton';
import EvidenceTabs from './EvidenceTabs';
import ExpandableText from './ExpandableText';
import CollapsibleSection from './CollapsibleSection';
import PrimaryPlatformIcon from './PrimaryPlatformIcon';

interface InfluencerCardProps {
  influencer: Influencer;
  expanded: boolean;
  approved: boolean;
  onToggleExpand: (id: string) => void;
  onToggleApprove: (id: string) => void;
}

// Dot label component for follower size
function SizeDotLabel({ followers }: { followers: number }) {
  const tier = getFollowerTier(followers);
  const config = FOLLOWER_TIER_CONFIG[tier];
  const isHuge = tier === 'huge';

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0"
      style={{
        backgroundColor: isHuge ? config.bgColor : config.bgColor,
        color: isHuge ? config.dotColor : config.dotColor,
        border: `1px solid ${isHuge ? '#374151' : config.dotColor + '40'}`,
      }}
      title={config.range}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.dotColor }}
      />
      {config.label}
    </span>
  );
}

const InfluencerCard = memo(function InfluencerCard({
  influencer,
  expanded,
  approved,
  onToggleExpand,
  onToggleApprove,
}: InfluencerCardProps) {
  const tierColor = getTierColor(influencer.tier);

  const identityTags = [influencer.creatorType, influencer.category, influencer.subcategory, influencer.language].filter(Boolean);

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-md ${
        approved
          ? 'border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-white'
          : ''
      }`}
      style={approved ? {} : { borderLeftWidth: 4, borderLeftColor: tierColor }}
    >
      {/* === COLLAPSED VIEW === */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr_1.2fr_auto] gap-3 md:gap-4 items-center">

        {/* ZONE 1: Identity */}
        <div className="min-w-0">
          {/* Size dot label above name */}
          <div className="mb-1.5">
            <SizeDotLabel followers={influencer.audienceSize} />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500 shrink-0">
              <User size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className="text-sm sm:text-[15px] font-semibold text-gray-800 truncate"
                  title={influencer.creatorName}
                >
                  {influencer.creatorName}
                </h3>
                {influencer.tier && (
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: tierColor }}
                  >
                    {influencer.tier}
                  </span>
                )}
              </div>
              {influencer.subcategory && (
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">{influencer.subcategory}</p>
              )}
              <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                <Globe size={11} />
                <span className="truncate">
                  {influencer.region}
                  {influencer.language ? ` \u00B7 ${influencer.language}` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ZONE 2: Scores + Total Score */}
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <ScoreBar
              score={influencer.contentFit}
              label="Content"
              ariaLabel={`Content Fit: ${influencer.contentFit} out of 5`}
            />
            <ScoreBar
              score={influencer.audienceEngagement}
              label="Audience"
              ariaLabel={`Audience & Engagement: ${influencer.audienceEngagement} out of 5`}
            />
            <ScoreBar
              score={influencer.authorityOpinion}
              label="Authority"
              ariaLabel={`Authority & Opinion: ${influencer.authorityOpinion} out of 5`}
            />
            <ScoreBar
              score={influencer.accessPartnership}
              label="Access"
              ariaLabel={`Access & Partnership: ${influencer.accessPartnership} out of 5`}
            />
            {/* Total Score Badge — Adjacent to score bars */}
            <div className="flex flex-col items-center shrink-0 ml-1">
              <div className="flex items-center justify-center w-10 h-8 rounded-lg bg-gray-800">
                <span className="text-sm font-bold text-white">{influencer.totalScore}</span>
              </div>
              <span className="text-[9px] uppercase tracking-wide text-gray-400 font-medium mt-0.5">Total</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 overflow-hidden">
              <PlatformIcons
                tiktokUrl={influencer.tiktokUrl}
                instagramUrl={influencer.instagramUrl}
                youtubeUrl={influencer.youtubeUrl}
                twitterUrl={influencer.twitterUrl}
                otherPlatformUrl={influencer.otherPlatformUrl}
              />
            </div>
          </div>
        </div>

        {/* ZONE 3: Metrics with Primary Platform icon */}
        <div className="flex items-center justify-start md:justify-center gap-3 sm:gap-4 shrink-0">
          {/* Primary platform icon — shows which platform the stats belong to */}
          <PrimaryPlatformIcon platform={influencer.primaryPlatform} />
          <div className="flex items-center gap-4 sm:gap-5">
            <div>
              <p className="text-base sm:text-lg font-bold text-gray-800">{formatNumber(influencer.audienceSize)}</p>
              <p className="text-[10px] text-gray-400">followers</p>
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-gray-800">{formatNumber(influencer.totalLikes)}</p>
              <p className="text-[10px] text-gray-400">likes</p>
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-gray-800">{influencer.videoCount || '-'}</p>
              <p className="text-[10px] text-gray-400">videos</p>
            </div>
          </div>
        </div>

        {/* ZONE 4: Actions */}
        <div className="flex items-center gap-2 shrink-0 justify-start md:justify-end">
          <ApproveButton approved={approved} onToggle={() => onToggleApprove(influencer.id)} />
          <button
            onClick={() => onToggleExpand(influencer.id)}
            className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* === EXPANDED PANEL === */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* Identity Tags */}
          {identityTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {identityTags.map((tag, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Total Likes:</span>
              <span className="text-sm font-semibold text-gray-700">{formatNumber(influencer.totalLikes)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Video Count:</span>
              <span className="text-sm font-semibold text-gray-700">{influencer.videoCount || '-'}</span>
            </div>
          </div>

          {/* Contact Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Contact Name</p>
              <p className="text-sm text-gray-700">{displayValue(influencer.contactName)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Email</p>
              {influencer.email && influencer.email.includes('@') ? (
                <a
                  href={`mailto:${influencer.email}`}
                  className="text-sm text-teal-600 hover:underline flex items-center gap-1 truncate"
                >
                  <Mail size={12} />
                  <span className="truncate">{displayValue(influencer.email)}</span>
                </a>
              ) : (
                <p className="text-sm text-gray-700">{displayValue(influencer.email)}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Link-in-Bio</p>
              {isValidUrl(influencer.linkInBio) ? (
                <a
                  href={influencer.linkInBio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-teal-600 hover:underline truncate flex items-center gap-1"
                >
                  <ExternalLink size={12} />
                  <span className="truncate">
                    {influencer.linkInBio.length > 35
                      ? influencer.linkInBio.substring(0, 35) + '...'
                      : influencer.linkInBio}
                  </span>
                </a>
              ) : (
                <p className="text-sm text-gray-700">{displayValue(influencer.linkInBio)}</p>
              )}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Agency</p>
              <p className="text-sm text-gray-700">{displayValue(influencer.agency)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">DM Viable</p>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
                  influencer.dmViable ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {influencer.dmViable ? <Check size={12} /> : <X size={12} />}
                {influencer.dmViable ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          {/* Platform Links with Icons */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-3">Platform Links</p>
            <PlatformLinksWithIcons
              tiktokUrl={influencer.tiktokUrl}
              instagramUrl={influencer.instagramUrl}
              youtubeUrl={influencer.youtubeUrl}
              twitterUrl={influencer.twitterUrl}
              otherPlatformUrl={influencer.otherPlatformUrl}
            />
          </div>

          {/* Description - only if content exists */}
          {hasContent(influencer.descriptionNotes) && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">Description</p>
              <ExpandableText text={influencer.descriptionNotes} maxHeight={100} />
            </div>
          )}

          {/* Evidence Tabs - Always visible */}
          <EvidenceTabs
            contentFit={influencer.contentFit}
            audienceEngagement={influencer.audienceEngagement}
            authorityOpinion={influencer.authorityOpinion}
            accessPartnership={influencer.accessPartnership}
            contentFitEvidence={influencer.contentFitEvidence}
            audienceEngagementEvidence={influencer.audienceEngagementEvidence}
            authorityOpinionEvidence={influencer.authorityOpinionEvidence}
            accessPartnershipEvidence={influencer.accessPartnershipEvidence}
          />

          {/* Collapsible Sections — collapsed by default */}
          <div className="space-y-3">
            <CollapsibleSection
              title="Observed Activity"
              text={influencer.observedActivity}
              icon={Eye}
              defaultExpanded={false}
            />
            <CollapsibleSection
              title="Partnership Angle"
              text={influencer.partnershipAngle}
              icon={Lightbulb}
              defaultExpanded={false}
            />
            <CollapsibleSection
              title="High Level Notes"
              text={influencer.highLevelNotes}
              icon={FileText}
              defaultExpanded={false}
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default InfluencerCard;
