import { memo } from 'react';
import { FaTiktok, FaInstagram, FaYoutube } from 'react-icons/fa6';
import { FaXTwitter } from 'react-icons/fa6';
import { Link2, ExternalLink } from 'lucide-react';
import { isValidUrl } from '@/utils/validators';

interface PlatformLinksWithIconsProps {
  tiktokUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  otherPlatformUrl: string;
}

const PlatformLinksWithIcons = memo(function PlatformLinksWithIcons({
  tiktokUrl,
  instagramUrl,
  youtubeUrl,
  twitterUrl,
  otherPlatformUrl,
}: PlatformLinksWithIconsProps) {
  const platforms = [
    { url: tiktokUrl, Icon: FaTiktok, label: 'TikTok', color: '#000000' },
    { url: instagramUrl, Icon: FaInstagram, label: 'Instagram', color: '#E4405F' },
    { url: youtubeUrl, Icon: FaYoutube, label: 'YouTube', color: '#FF0000' },
    { url: twitterUrl, Icon: FaXTwitter, label: 'X / Twitter', color: '#000000' },
  ];

  const validSocials = platforms.filter(p => isValidUrl(p.url));
  const hasOther = isValidUrl(otherPlatformUrl);
  const otherLinks: { label: string; url: string }[] = [];

  // Parse otherPlatformUrl - could be multiple URLs separated by commas, newlines, or spaces
  if (hasOther) {
    const parts = otherPlatformUrl.split(/[,\s]+/).filter(u => isValidUrl(u));
    if (parts.length > 0) {
      parts.forEach(url => {
        let label = 'Website';
        try {
          const hostname = new URL(url).hostname.replace(/^www\./, '');
          label = hostname;
        } catch { /* ignore */ }
        otherLinks.push({ label, url });
      });
    } else {
      otherLinks.push({ label: 'Website', url: otherPlatformUrl });
    }
  }

  if (validSocials.length === 0 && otherLinks.length === 0) return null;

  return (
    <div className="space-y-2">
      {validSocials.map(({ url, Icon, label }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 text-sm text-gray-700 hover:text-teal-600 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-teal-50 flex items-center justify-center transition-colors">
            <Icon size={16} style={{ color: 'currentColor' }} className="text-gray-500 group-hover:text-teal-600" />
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="font-medium text-[13px]">{label}</span>
            <span className="text-gray-300 text-[11px] truncate">{url.length > 50 ? url.substring(0, 50) + '...' : url}</span>
          </div>
          <ExternalLink size={12} className="text-gray-300 group-hover:text-teal-500 transition-colors" />
        </a>
      ))}
      {otherLinks.map(({ url, label }, i) => (
        <a
          key={`other-${i}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 text-sm text-gray-700 hover:text-teal-600 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-teal-50 flex items-center justify-center transition-colors">
            <Link2 size={16} className="text-gray-500 group-hover:text-teal-600" />
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="font-medium text-[13px]">{label}</span>
            <span className="text-gray-300 text-[11px] truncate">{url.length > 50 ? url.substring(0, 50) + '...' : url}</span>
          </div>
          <ExternalLink size={12} className="text-gray-300 group-hover:text-teal-500 transition-colors" />
        </a>
      ))}
    </div>
  );
});

export default PlatformLinksWithIcons;
