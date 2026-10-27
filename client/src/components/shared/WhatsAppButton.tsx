import { useState } from 'react';
import { Check, MessageSquare } from 'lucide-react';
import { copyToClipboard } from '../../lib/format';

interface WhatsAppButtonProps {
  questionsText: string;
  phone?: string;
  compact?: boolean;
}

export function WhatsAppButton({ questionsText, compact = false }: WhatsAppButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(questionsText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex w-full items-center justify-center gap-2 border border-[#111827] bg-[#111827] font-bold text-white transition-all hover:bg-stone-800 active:bg-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
        compact ? 'py-2 px-3 text-[12px]' : 'py-3 px-4 text-[13px]'
      }`}
    >
      {copied ? (
        <>
          <Check size={16} className="text-emerald-400" />
          <span>¡Interrogatorio copiado para WhatsApp!</span>
        </>
      ) : (
        <>
          <MessageSquare size={16} />
          <span>Copiar interrogatorio para el corredor</span>
        </>
      )}
    </button>
  );
}
