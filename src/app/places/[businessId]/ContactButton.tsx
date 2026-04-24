'use client';

import { Phone, MessageSquare, Map as MapIcon } from 'lucide-react';

interface ContactButtonProps {
  businessId: string;
  type: 'call' | 'chat' | 'visit';
  href: string;
  label: string;
}

export default function ContactButton({
  businessId, type, href, label,
}: ContactButtonProps) {
  const handleClick = async () => {
    // 유입 카운터 기록 (fire-and-forget)
    fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, contactType: type }),
    }).catch((err) => console.error('Failed to log contact:', err));
  };

  const Icon = type === 'call' ? Phone : type === 'chat' ? MessageSquare : MapIcon;

  return (
    <a
      href={href}
      target={type !== 'call' ? '_blank' : undefined}
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`block w-full text-center font-black py-5 rounded-[1.5rem] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl
        ${type === 'call' 
          ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/20' 
          : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700 shadow-black/40'
        }`}
    >
      <Icon size={20} fill={type === 'call' ? 'black' : 'none'} />
      {label}
    </a>
  );
}
