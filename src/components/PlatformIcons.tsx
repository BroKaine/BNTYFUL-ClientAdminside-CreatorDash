import React from 'react';
import { FaTiktok, FaInstagram, FaYoutube } from 'react-icons/fa6';
import { FaXTwitter } from 'react-icons/fa6';
import { Link2 } from 'lucide-react';
import { isValidUrl } from '@/utils/validators';

interface PlatformIconsProps {
  tiktokUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  otherPlatformUrl: string;
  size?: number;
}

const PlatformIcons = React.memo(function PlatformIcons({
  tiktokUrl,
  instagramUrl,
  youtubeUrl,
  twitterUrl,
  otherPlatformUrl,
  size = 18,
}: PlatformIconsProps) {
  const platforms = [
    { url: tiktokUrl, icon: FaTiktok, label: 'TikTok' },
    { url: instagramUrl, icon: FaInstagram, label: 'Instagram' },
    { url: youtubeUrl, icon: FaYoutube, label: 'YouTube' },
    { url: twitterUrl, icon: FaXTwitter, label: 'X/Twitter' },
    { url: otherPlatformUrl, icon: Link2, label: 'Other' },
  ];

  const validPlatforms = platforms.filter(p => isValidUrl(p.url));

  if (validPlatforms.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {validPlatforms.map(({ url, icon: Icon, label }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${label} profile`}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          onClick={e => e.stopPropagation()}
        >
          <Icon size={size} />
        </a>
      ))}
    </div>
  );
});

export default PlatformIcons;
