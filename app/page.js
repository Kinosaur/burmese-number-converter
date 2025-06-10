'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ClipboardPaste, Heart, Heart as HeartFilled } from 'lucide-react';

// Array-based for easier mapping and iteration
const burmeseDigits = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
const burmeseNumbers = ['သုည', 'တစ်', 'နှစ်', 'သုံး', 'လေး', 'ငါး', 'ခြောက်', 'ခုနစ်', 'ရှစ်', 'ကိုး'];
const burmeseUnits = [
  { value: 100000, text: 'သိန်း' },
  { value: 10000, text: 'သောင်း' },
  { value: 1000, text: 'ထောင်' },
  { value: 100, text: 'ရာ' },
  { value: 10, text: 'ဆယ်' },
  { value: 1, text: '' },
];
const burmeseTextToNum = {
  'တစ်': 1, 'နှစ်': 2, 'သုံး': 3, 'လေး': 4, 'ငါး': 5,
  'ခြောက်': 6, 'ခုနစ်': 7, 'ရှစ်': 8, 'ကိုး': 9, 'သုည': 0,
};

function numberToBurmese(num) {
  if (num === 0) return 'သုည';
  num = Math.abs(num);

  // Special case: 2,000,000 to 9,000,000, no remainder
  if (num % 1000000 === 0 && num >= 2000000 && num <= 9000000) {
    const tens = num / 100000; // e.g., 2,000,000 / 100,000 = 20
    if (tens % 10 === 0 && tens >= 20 && tens <= 90) {
      // tens / 10 gives 2, 3, ..., 9
      const burmeseTens = burmeseNumbers[tens / 10] + 'ဆယ်';
      return 'သိန်း' + burmeseTens;
    }
  }

  // Special case: 20,000,000 to 90,000,000, no remainder
  if (num % 10000000 === 0 && num >= 10000000 && num <= 90000000) {
    const hundreds = num / 100000; // e.g., 20,000,000 / 100,000 = 200
    if (hundreds % 100 === 0 && hundreds >= 100 && hundreds <= 900) {
      // tens / 10 gives 2, 3, ..., 9
      const burmeseHundreds = burmeseNumbers[hundreds / 100] + 'ရာ';
      return 'သိန်း' + burmeseHundreds;
    }
  }

  // Special case: 200,000,000 to 900,000,000, no remainder
  if (num % 100000000 === 0 && num >= 100000000 && num <= 900000000) {
    const thousands = num / 100000; // e.g., 200,000,000 / 100,000 = 2000
    if (thousands % 1000 === 0 && thousands >= 1000 && thousands <= 9000) {
      // tens / 10 gives 2, 3, ..., 9
      const burmeseThousands = burmeseNumbers[thousands / 1000] + 'ထောင်';
      return 'သိန်း' + burmeseThousands;
    }
  }

  function breakdown(n) {
    let result = '';
    let remaining = n;
    for (let i = 0; i < burmeseUnits.length; i++) {
      const { value, text } = burmeseUnits[i];
      if (remaining >= value) {
        const count = Math.floor(remaining / value);
        if (count > 0) {
          let countText = '';
          if (count === 1) {
            countText = 'တစ်';
          } else if (count <= 9) {
            countText = burmeseNumbers[count];
          } else {
            countText = breakdown(count); // recursively break down count
          }
          // For the lowest unit (value === 1), don't add a unit label
          result += countText + (value === 1 ? '' : text);
          // Add (့) for thousands, hundreds, and tens if there are non-zero lower units
          const lowerUnits = burmeseUnits.slice(i + 1);
          const hasLowerUnits = lowerUnits.some(({ value: lowerValue }) => Math.floor(remaining % value / lowerValue) > 0);
          if (hasLowerUnits && (value === 1000 || value === 100 || value === 10)) {
            result += '့';
          }
          remaining %= value;
        }
      }
    }
    return result;
  }

  return breakdown(num).trim();
}

function burmeseToNumber(burmese) {
  if (!burmese || burmese.trim() === 'သုည') return 0;
  let clean = burmese.trim().replace(/\s+/g, ' ');
  let total = 0;

  // Process units, excluding ones place unless explicitly present
  for (const { value, text } of burmeseUnits.filter(unit => unit.value !== 1)) {
    // Match unit with or without virama (့)
    const regex = new RegExp(`([\\u1000-\\u109F]+)?${text}(?:့)?\\s*`);
    const match = clean.match(regex);
    if (match) {
      const numText = match[1] || 'တစ်'; // Default to 'တစ်' (1) if no number is specified
      const num = burmeseTextToNum[numText];
      if (num === undefined) {
        throw new Error('Invalid Burmese number format');
      }
      total += num * value;
      clean = clean.replace(match[0], '').trim();
    }
  }

  // Remove special handling for 'ခု' (ones place)
  // Instead, after processing all units, if any clean text remains, try to match a Burmese number word (e.g., 'တစ်', 'နှစ်', ...)
  if (clean) {
    // Try to match a single Burmese number word (e.g., 'တစ်', 'နှစ်', ...)
    const num = burmeseTextToNum[clean];
    if (num !== undefined) {
      total += num;
      clean = '';
    } else {
      // Fallback: check for Burmese digits (e.g., ၁၂၃)
      let digits = [...clean].map(ch => burmeseDigits.indexOf(ch));
      if (digits.every(d => d >= 0)) {
        total += parseInt(digits.join(''), 10);
      } else {
        throw new Error('Invalid Burmese number format');
      }
    }
  }

  return total;
}

export default function Home() {
  const [standardNumber, setStandardNumber] = useState('');
  const [burmeseNumber, setBurmeseNumber] = useState('');
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [stickyHover, setStickyHover] = useState(false);
  const buttonRef = useRef(null);
  const iconRef = useRef(null);
  const clearButtonRef = useRef(null);

  // Animate with GSAP on theme toggle with cleanup
  useEffect(() => {
    if (!buttonRef.current || !iconRef.current) return;
    const ctx = gsap.context(() => {
      gsap.set(buttonRef.current, { clearProps: 'all' });
      gsap.set(iconRef.current, { clearProps: 'all' });
      if (darkMode) {
        gsap.fromTo(
          buttonRef.current,
          { scale: 1, rotate: 0, backgroundColor: '#1c1917' },
          { scale: 1.08, rotate: 12, backgroundColor: '#1c1917', duration: 0.32, yoyo: true, repeat: 1, ease: 'power2.inOut' }
        );
        gsap.fromTo(
          iconRef.current,
          { rotate: 0, scale: 1 },
          { rotate: 360, scale: 1.18, duration: 0.6, ease: 'power2.inOut' }
        );
      } else {
        gsap.fromTo(
          buttonRef.current,
          { scale: 1, rotate: 0, backgroundColor: '#fef9c3' },
          { scale: 1.08, rotate: -12, backgroundColor: '#fef9c3', duration: 0.32, yoyo: true, repeat: 1, ease: 'power2.inOut' }
        );
        gsap.fromTo(
          iconRef.current,
          { rotate: 0, scale: 1 },
          { rotate: -360, scale: 1.18, duration: 0.6, ease: 'power2.inOut' }
        );
      }
    });
    return () => ctx.revert(); // Clean up animations
  }, [darkMode]);

  // --- Theme toggle button follow-cursor effect (optimized & throttled) ---
  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    let rafId = null;
    let target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };
    const maxDist = 60;
    let inside = false;
    let ticking = false;

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    const update = () => {
      current.x = lerp(current.x, target.x, 0.18);
      current.y = lerp(current.y, target.y, 0.18);
      gsap.set(btn, { x: current.x, y: current.y });
      if (Math.abs(current.x - target.x) > 0.5 || Math.abs(current.y - target.y) > 0.5) {
        rafId = requestAnimationFrame(update);
      } else {
        current.x = target.x;
        current.y = target.y;
        gsap.set(btn, { x: current.x, y: current.y });
        rafId = null;
      }
    };

    const handleMove = (e) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const x = e.clientX - cx;
        const y = e.clientY - cy;
        const dist = Math.sqrt(x * x + y * y);
        if (dist < r.width * 0.7) {
          inside = true;
          target.x = Math.max(-maxDist, Math.min(maxDist, x * 0.25));
          target.y = Math.max(-maxDist, Math.min(maxDist, y * 0.25));
          if (!rafId) rafId = requestAnimationFrame(update);
        } else if (inside) {
          inside = false;
          target.x = 0;
          target.y = 0;
          if (!rafId) rafId = requestAnimationFrame(update);
        }
        ticking = false;
      });
    };
    const handleLeave = () => {
      inside = false;
      target.x = 0;
      target.y = 0;
      if (!rafId) rafId = requestAnimationFrame(update);
    };
    window.addEventListener('mousemove', handleMove);
    btn.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      btn.removeEventListener('mouseleave', handleLeave);
      if (rafId) cancelAnimationFrame(rafId);
      gsap.set(btn, { x: 0, y: 0 });
    };
  }, []);

  // --- Social floating buttons follow-cursor animation (throttled) ---
  useEffect(() => {
    const btns = Array.from(document.querySelectorAll('.social-float-btn'));
    if (!btns.length) return;
    let rafId = null;
    let targets = btns.map(() => ({ x: 0, y: 0 }));
    let currents = btns.map(() => ({ x: 0, y: 0 }));
    const maxDist = 40;
    let insides = btns.map(() => false);
    let ticking = false;

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }
    const update = () => {
      btns.forEach((btn, i) => {
        currents[i].x = lerp(currents[i].x, targets[i].x, 0.18);
        currents[i].y = lerp(currents[i].y, targets[i].y, 0.18);
        gsap.set(btn, { x: currents[i].x, y: currents[i].y });
      });
      if (btns.some((_, i) => Math.abs(currents[i].x - targets[i].x) > 0.5 || Math.abs(currents[i].y - targets[i].y) > 0.5)) {
        rafId = requestAnimationFrame(update);
      } else {
        btns.forEach((btn, i) => {
          currents[i].x = targets[i].x;
          currents[i].y = targets[i].y;
          gsap.set(btn, { x: currents[i].x, y: currents[i].y });
        });
        rafId = null;
      }
    };
    const handleMove = (e) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        btns.forEach((btn, i) => {
          const r = btn.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const x = e.clientX - cx;
          const y = e.clientY - cy;
          const dist = Math.sqrt(x * x + y * y);
          if (dist < r.width * 0.7) {
            insides[i] = true;
            targets[i].x = Math.max(-maxDist, Math.min(maxDist, x * 0.25));
            targets[i].y = Math.max(-maxDist, Math.min(maxDist, y * 0.25));
            if (!rafId) rafId = requestAnimationFrame(update);
          } else if (insides[i]) {
            insides[i] = false;
            targets[i].x = 0;
            targets[i].y = 0;
            if (!rafId) rafId = requestAnimationFrame(update);
          }
        });
        ticking = false;
      });
    };
    const handleLeave = () => {
      targets.forEach((t, i) => { t.x = 0; t.y = 0; insides[i] = false; });
      if (!rafId) rafId = requestAnimationFrame(update);
    };
    window.addEventListener('mousemove', handleMove);
    btns.forEach(btn => btn.addEventListener('mouseleave', handleLeave));
    return () => {
      window.removeEventListener('mousemove', handleMove);
      btns.forEach(btn => btn.removeEventListener('mouseleave', handleLeave));
      if (rafId) cancelAnimationFrame(rafId);
      btns.forEach(btn => gsap.set(btn, { x: 0, y: 0 }));
    };
  }, []);

  const handleStandardInput = useCallback((e) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '') {
      setStandardNumber('');
      setBurmeseNumber('');
      setError('');
      return;
    }
    if (!/^[\d,]+$/.test(value)) {
      setError('Please enter a valid number (e.g., 100,000)');
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || num > 999999999) {
      setError('Please enter a number not greater than 999,999,999');
      return;
    }
    setStandardNumber(num.toLocaleString());
    setBurmeseNumber(numberToBurmese(num));
    setError('');
  }, []);

  const handleBurmeseInput = useCallback((e) => {
    const value = e.target.value;
    setBurmeseNumber(value);
    try {
      const num = burmeseToNumber(value);
      setStandardNumber(num.toLocaleString());
      setError('');
    } catch {
      setError('Invalid Burmese number format (e.g., တစ်သိန်း နှစ်ထောင်)');
    }
  }, []);

  const clearInputs = useCallback(() => {
    if (clearButtonRef.current) {
      gsap.fromTo(
        clearButtonRef.current,
        { scale: 1, backgroundColor: '#2563eb', color: '#fff', boxShadow: '0 0 0 rgba(0, 0, 0, 0.1)' },
        {
          scale: 0.92,
          backgroundColor: '#fff',
          color: '#2563eb',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
          duration: 0.12,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            gsap.set(clearButtonRef.current, {
              scale: 1,
              backgroundColor: '#2563eb',
              color: '#fff',
              boxShadow: '0 0 0 rgba(0, 0, 0, 0.1)'
            });
          }
        }
      );
    }
    setStandardNumber('');
    setBurmeseNumber('');
    setError('');
  }, []);

  const handleThemeToggle = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const handleCopy = useCallback((value) => {
    if (value) navigator.clipboard.writeText(value);
  }, []);

  const handlePasteStandard = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    setStandardNumber(text);
    try {
      const num = parseInt(text.replace(/,/g, ''), 10);
      if (!isNaN(num)) {
        setStandardNumber(num.toLocaleString());
        setBurmeseNumber(numberToBurmese(num));
        setError('');
      } else {
        setError('Please enter a valid number (e.g., 100,000)');
      }
    } catch {
      setError('Paste failed');
    }
  }, []);

  const handlePasteBurmese = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    setBurmeseNumber(text);
    try {
      const num = burmeseToNumber(text);
      setStandardNumber(num.toLocaleString());
      setError('');
    } catch {
      setError('Invalid Burmese number format (e.g., တစ်သိန်း နှစ်ထောင်)');
    }
  }, []);

  return (
    <div className={`page-bg ${darkMode ? 'bg-gray-900' : 'bg-neutral-50'} min-h-screen flex flex-col justify-between p-2 sm:p-4 relative overflow-hidden transition-colors duration-300`}>
      <style jsx global>{`
        .page-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.18;
          background:
            radial-gradient(circle, ${darkMode ? '#fff' : '#000'} 1.2px, transparent 1.5px) repeat;
          background-size: 18px 18px;
          transition: background 0.3s;
        }
        textarea#burmeseNumber::placeholder {
          color: ${darkMode ? '#969BA3' : '#969BA3'};
          opacity: 1;
          transition: color 0.3s;
        }
      `}</style>
      <button
        ref={buttonRef}
        className={`fixed top-4 left-4 sm:top-8 sm:left-8 flex items-center justify-center p-0 rounded-full text-2xl sm:text-3xl transition-colors duration-200 outline-none focus:outline-none overflow-hidden z-20 w-14 h-14 sm:w-20 sm:h-20`}
        onClick={handleThemeToggle}
        aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
        title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
        style={{
          border: 'none',
          backgroundColor: darkMode ? '#1f2937' : '#fef9c3',
        }}
      >
        <span className="sr-only">Toggle theme</span>
        <span className="relative flex items-center justify-center w-full h-full">
          <span ref={iconRef} style={{ zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
          </span>
        </span>
      </button>
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} p-4 sm:p-8 md:p-12 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-full sm:max-w-2xl transition-colors duration-300 relative z-10 text-base sm:text-lg mx-auto`}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Burmese Number Converter</h1>
          <div className="flex flex-col gap-6 sm:gap-8">
            <div>
              <label htmlFor="standardNumber" className="block text-base sm:text-lg font-medium mb-1">Standard Number</label>
              <div className="flex flex-row items-center gap-2 w-full">
                <input
                  id="standardNumber"
                  type="text"
                  value={standardNumber}
                  onChange={handleStandardInput}
                  className={`flex-1 min-w-0 p-2 sm:p-3 text-base sm:text-lg rounded-md border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'} shadow-sm hover:shadow-md focus:shadow-lg focus:border-blue-400 focus:scale-[1.025]'}`}
                  placeholder="Enter a number"
                  aria-describedby="standardNumberHelp"
                  aria-invalid={error ? 'true' : 'false'}
                  aria-errormessage={error ? 'error-message' : undefined}
                />
                <div className="flex-none ml-2">
                  <button
                    type="button"
                    onClick={handlePasteStandard}
                    className="paste-btn focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    aria-label="Paste to Standard Number"
                    title="Paste"
                  >
                    <ClipboardPaste size={30} strokeWidth={2.2} aria-hidden="true" focusable="false" />
                  </button>
                </div>
              </div>
              <p id="standardNumberHelp" className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                e.g., 123,456
              </p>
            </div>
            <div>
              <label htmlFor="burmeseNumber" className="block text-base sm:text-lg font-medium mb-1">Burmese Number</label>
              <div className="flex flex-row items-center gap-2 w-full">
                <textarea
                  id="burmeseNumber"
                  value={burmeseNumber}
                  onChange={handleBurmeseInput}
                  className={`flex-1 min-w-0 p-2 sm:p-3 text-base sm:text-lg rounded-md border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 resize-y ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'} shadow-sm hover:shadow-md focus:shadow-lg focus:border-blue-400 focus:scale-[1.025]'}`}
                  style={{
                    fontFamily: "'Myanmar Text', 'Noto Sans Myanmar', 'Padauk', sans-serif",
                    fontVariantNumeric: 'tabular-nums',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto',
                  }}
                  placeholder="Enter Burmese number"
                  aria-describedby="burmeseNumberHelp"
                  aria-invalid={error ? 'true' : 'false'}
                  aria-errormessage={error ? 'error-message' : undefined}
                />
                <div className="flex-none ml-2">
                  <button
                    type="button"
                    onClick={handlePasteBurmese}
                    className="paste-btn focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    aria-label="Paste to Burmese Number"
                    title="Paste"
                  >
                    <ClipboardPaste size={30} strokeWidth={2.2} aria-hidden="true" focusable="false" />
                  </button>
                </div>
              </div>
              <p id="burmeseNumberHelp" className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                e.g., တစ်သိန်း နှစ်ထောင်
              </p>
            </div>
          </div>
          {error && (
            <p id="error-message" className="mt-6 text-red-600 dark:text-red-400 text-center text-base sm:text-lg">
              {error}
            </p>
          )}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              ref={clearButtonRef}
              onClick={clearInputs}
              className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-base sm:text-lg font-semibold rounded-md bg-blue-600 text-white shadow-md"
            >
              Clear
            </button>
          </div>
        </div>
        {/* Social Floating Icons */}
        <div id="social-float" className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-row sm:flex-col gap-3 sm:gap-4 z-30">
          <a
            href="https://www.facebook.com/profile.php?id=61574923034684" target="_blank" rel="noopener noreferrer"
            className="social-float-btn group"
            aria-label="Facebook"
          >
            {/* SimpleIcons Facebook */}
            <svg width="24" height="24" className="sm:w-8 sm:h-8 w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 6.019 4.438 10.987 10.125 11.854v-8.385H7.078v-3.47h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.953.925-1.953 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.562 22.987 24 18.019 24 12z" fill="#1877F2" />
              <path d="M16.671 15.47l.532-3.47h-3.328v-2.25c0-.949.462-1.874 1.953-1.874h1.513V4.979s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.586H7.078v3.47h3.047v8.385a12.07 12.07 0 003.75 0v-8.385h2.796z" fill="#fff" />
            </svg>
          </a>
          <a
            href="https://github.com/Kinosaur" target="_blank" rel="noopener noreferrer"
            className="social-float-btn group"
            aria-label="GitHub"
          >
            {/* SimpleIcons GitHub */}
            <svg width="24" height="24" className="sm:w-8 sm:h-8 w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M12 0C5.371 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.371.823 1.102.823 2.222v3.293c0 .322.218.694.825.576C20.565 21.796 24 17.299 24 12c0-6.627-5.373-12-12-12z" fill="#181717" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/in/kaung-khant-lin-33a477274/" target="_blank" rel="noopener noreferrer"
            className="social-float-btn group"
            aria-label="LinkedIn"
          >
            {/* SimpleIcons LinkedIn */}
            <svg width="24" height="24" className="sm:w-8 sm:h-8 w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.327-.027-3.037-1.849-3.037-1.851 0-2.132 1.445-2.132 2.939v5.667H9.358V9h3.414v1.561h.049c.476-.899 1.637-1.849 3.37-1.849 3.602 0 4.267 2.368 4.267 5.455v6.285zM5.337 7.433a2.062 2.062 0 01-2.06-2.066c0-1.14.92-2.066 2.06-2.066 1.14 0 2.06.926 2.06 2.066 0 1.14-.92 2.066-2.06 2.066zm1.777 13.019H3.56V9h3.554v11.452z" fill="#0A66C2" />
            </svg>
          </a>
        </div>
      </main>
      {/* Made with love by Kino sticky note as footer */}
      <footer className="w-full flex items-center justify-center fixed bottom-4 left-0 z-20">
        <div
          className="made-by-sticky flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg font-mono text-base sm:text-lg font-semibold bg-yellow-100/90 dark:bg-yellow-300/90 border border-yellow-300 dark:border-yellow-400 text-yellow-900 dark:text-yellow-800"
          style={{ backdropFilter: 'blur(2px)' }}
          onMouseEnter={() => setStickyHover(true)}
          onMouseLeave={() => setStickyHover(false)}
        >
          <span>made with</span>
          <span className="inline-flex items-center">
            {stickyHover ? (
              <HeartFilled size={20} className="text-red-500 animate-pulse" aria-label="love" fill="#ef4444" />
            ) : (
              <Heart size={20} className="text-red-500 animate-pulse" aria-label="love" />
            )}
          </span>
          <span>by Kino</span>
        </div>
      </footer>
    </div>
  );
}