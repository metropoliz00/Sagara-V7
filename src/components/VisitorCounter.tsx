import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Function for Rolling Digit Effect
function RollingDigit({ digit }: { digit: string; key?: string }) {
  if (digit === '.' || digit === ',') {
    return (
      <span className="text-main-blue font-black px-0.5 text-xs md:text-sm self-center">
        {digit}
      </span>
    );
  }

  const num = parseInt(digit, 10);
  if (isNaN(num)) {
    return <span className="font-mono font-bold text-xs md:text-sm">{digit}</span>;
  }

  return (
    <div className="relative h-6 w-4 overflow-hidden bg-gradient-to-b from-main-blue/90 to-dark-blue text-white rounded-[4px] shadow-sm flex items-center justify-center font-mono text-xs md:text-sm font-black tracking-tighter shrink-0 border border-white/20">
      <motion.div
        key={num}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {num}
      </motion.div>
    </div>
  );
}

// Roll count from 1 up to target
export function RollingNumberDisplay({ targetValue }: { targetValue: number }) {
  const [currentValue, setCurrentValue] = useState(1);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (targetValue <= 0) {
      setCurrentValue(1);
      return;
    }

    const startValue = 1;
    const duration = 1500; // 1.5 seconds rolling animation
    const startTime = performance.now();

    const animateRoll = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const val = Math.floor(startValue + (targetValue - startValue) * easeOut);
      
      setCurrentValue(val);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateRoll);
      } else {
        setCurrentValue(targetValue);
      }
    };

    animationRef.current = requestAnimationFrame(animateRoll);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue]);

  const formattedStr = currentValue.toLocaleString('id-ID');

  return (
    <div className="flex items-center gap-0.5 select-none py-0.5">
      {formattedStr.split('').map((char, index) => (
        <RollingDigit key={`${index}-${char}`} digit={char} />
      ))}
    </div>
  );
}

interface VisitorCounterProps {
  className?: string;
  variant?: 'navbar' | 'badge';
}

export default function VisitorCounter({ className = "", variant = "navbar" }: VisitorCounterProps) {
  const [visitorCount, setVisitorCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function recordAndFetchVisitor() {
      try {
        const STORAGE_KEY = 'gugus03_visitor_local_count';
        const SESSION_FLAG = 'gugus03_visited_session_id';

        let remoteCount = 0;

        if (supabase) {
          const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
          const pagePath = typeof window !== 'undefined' ? window.location.pathname || 'beranda' : 'beranda';

          // 1. Record visit to site_visitors table in Supabase
          try {
            await supabase
              .from('site_visitors')
              .insert([{ visited_at: new Date().toISOString(), page: pagePath, user_agent: userAgent }]);
          } catch (e) {
            // site_visitors table might not exist yet
          }

          // 2. Fetch total count from site_visitors table
          const { count, error: countErr } = await supabase
            .from('site_visitors')
            .select('*', { count: 'exact', head: true });

          if (!countErr && typeof count === 'number' && count > 0) {
            remoteCount = count;
          }

          // 3. Sync or fallback with site_settings table in Supabase
          try {
            const { data: settingsData } = await supabase
              .from('site_settings')
              .select('content')
              .eq('id', 1)
              .single();

            if (settingsData && settingsData.content) {
              const currentContent = settingsData.content || {};
              const currentDbCount = Number(currentContent.visitor_count || 0);

              if (remoteCount > 0) {
                // Keep site_settings in sync with site_visitors count
                if (currentDbCount !== remoteCount) {
                  await supabase
                    .from('site_settings')
                    .upsert({ id: 1, content: { ...currentContent, visitor_count: remoteCount } });
                }
              } else {
                // If site_visitors count is 0 or unavailable, increment site_settings visitor_count in database
                const newDbCount = currentDbCount + 1;
                remoteCount = newDbCount;
                await supabase
                  .from('site_settings')
                  .upsert({ id: 1, content: { ...currentContent, visitor_count: newDbCount } });
              }
            } else if (remoteCount === 0) {
              // Initialize site_settings row in database
              remoteCount = 1;
              await supabase
                .from('site_settings')
                .upsert({ id: 1, content: { visitor_count: 1 } });
            }
          } catch (e) {
            // ignore
          }
        }

        // Determine final display count strictly based on real database value
        let finalCount = remoteCount;
        
        if (finalCount <= 0) {
          // If database is not reachable, fallback to 1 + local tracking
          const localCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
          finalCount = localCount > 0 && localCount < 1000 ? localCount + 1 : 1;
        }

        // Save real count back to localStorage to clear any old dummy data
        localStorage.setItem(STORAGE_KEY, finalCount.toString());
        sessionStorage.setItem(SESSION_FLAG, Date.now().toString());

        if (isMounted) {
          setVisitorCount(finalCount);
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setVisitorCount(1);
          setIsLoading(false);
        }
      }
    }

    recordAndFetchVisitor();

    return () => {
      isMounted = false;
    };
  }, []);

  if (variant === 'badge') {
    return (
      <div className={`relative ${className}`}>
        <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 px-4 py-2 rounded-full shadow-lg shadow-main-blue/10 flex items-center gap-2.5">
          <div className="relative flex items-center justify-center shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-gray-700">
              Visitor:
            </span>
            {isLoading ? (
              <div className="h-6 w-12 bg-gray-200 animate-pulse rounded" />
            ) : (
              <RollingNumberDisplay targetValue={visitorCount} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Navbar variant (Clean & Compact)
  return (
    <div className={`flex items-center ${className}`}>
      <div className="bg-white/90 border border-gray-200/90 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2">
        <div className="relative flex items-center justify-center shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">
            Visitor:
          </span>
          {isLoading ? (
            <div className="h-5 w-10 bg-gray-200 animate-pulse rounded" />
          ) : (
            <RollingNumberDisplay targetValue={visitorCount} />
          )}
        </div>
      </div>
    </div>
  );
}
