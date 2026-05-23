import { memo } from 'react';
import { FaTiktok, FaInstagram, FaYoutube } from 'react-icons/fa6';
import { FaXTwitter } from 'react-icons/fa6';
import { Globe } from 'lucide-react';

interface PrimaryPlatformIconProps {
  platform: string;
  size?: number;
}

const PLATFORM_CONFIG: Record<string, { Icon: typeof FaTiktok; bg: string; label: string }> = {
  tiktok: { Icon: FaTiktok, bg: '#000000', label: 'TikTok' },
  youtube: { Icon: FaYoutube, bg: '#FF0000', label: 'YouTube' },
  instagram: { Icon: FaInstagram, bg: '#E4405F', label: 'Instagram' },
  x: { Icon: FaXTwitter, bg: '#000000', label: 'X' },
  twitter: { Icon: FaXTwitter, bg: '#000000', label: 'X' },
};

function normalizePlatform(platform: string): string {
  return platform.toLowerCase().replace(/[^a-z]/g, '');
}

const PrimaryPlatformIcon = memo(function PrimaryPlatformIcon({ platform, size = 16 }: PrimaryPlatformIconProps) {
  if (!platform || platform.trim() === '') {
    return (
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-200 shrink-0"
        title="No primary platform"
      >
        <Globe size={size} className="text-gray-500" />
      </div>
    );
  }

  const normalized = normalizePlatform(platform);
  const config = PLATFORM_CONFIG[normalized];

  if (!config) {
    return (
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-200 shrink-0"
        title={platform}
      >
        <Globe size={size} className="text-gray-500" />
      </div>
    );
  }

  const { Icon, bg, label } = config;

  return (
    <div
      className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
      style={{ backgroundColor: bg }}
      title={`${label} \u00B7 Primary Platform`}
    >
      <Icon size={size} className="text-white" />
    </div>
  );
});

export default PrimaryPlatformIcon;
