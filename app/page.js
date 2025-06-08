'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import gsap from 'gsap';

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

  // Handle ones place only if 'ခု' is explicitly present
  const onesRegex = new RegExp(`([\\u1000-\\u109F]+)?ခု\\s*`);
  const onesMatch = clean.match(onesRegex);
  if (onesMatch) {
    const numText = onesMatch[1] || 'တစ်';
    const num = burmeseTextToNum[numText];
    if (num === undefined) {
      throw new Error('Invalid Burmese number format');
    }
    total += num;
    clean = clean.replace(onesMatch[0], '').trim();
  }

  // Handle remaining digits if any (e.g., ၁၂၃)
  if (clean) {
    let digits = [...clean].map(ch => burmeseDigits.indexOf(ch));
    if (digits.every(d => d >= 0)) {
      total += parseInt(digits.join(''), 10);
    } else {
      throw new Error('Invalid Burmese number format');
    }
  }

  return total;
}

export default function Home() {
  const [standardNumber, setStandardNumber] = useState('');
  const [burmeseNumber, setBurmeseNumber] = useState('');
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const buttonRef = useRef(null);
  const iconRef = useRef(null);

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
    setStandardNumber('');
    setBurmeseNumber('');
    setError('');
  }, []);

  const handleThemeToggle = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  return (
    <div className={`page-bg ${darkMode ? 'bg-gray-900' : 'bg-neutral-50'} min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300`}>
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
      `}</style>
      <button
        ref={buttonRef}
        className={`absolute top-4 left-4 flex items-center justify-center p-0 rounded-full text-3xl transition-colors duration-200 outline-none focus:outline-none overflow-hidden`}
        onClick={handleThemeToggle}
        aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
        title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
        style={{
          width: 80,
          height: 80,
          minWidth: 80,
          minHeight: 80,
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
      <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} p-12 rounded-2xl shadow-2xl w-full max-w-2xl transition-colors duration-300 relative z-10 text-lg mx-auto`}>
        <h1 className="text-3xl font-bold mb-6 text-center">Burmese Number Converter</h1>
        <div className="flex flex-col gap-8">
          <div>
            <label htmlFor="standardNumber" className="block text-base font-medium mb-1">Standard Number</label>
            <input
              id="standardNumber"
              type="text"
              value={standardNumber}
              onChange={handleStandardInput}
              className={`block w-full p-3 text-lg rounded-md border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'} shadow-sm hover:shadow-md focus:shadow-lg focus:border-blue-400 focus:scale-[1.025]'}`}
              style={{
                transition: 'box-shadow 0.3s, border-color 0.3s, background 0.3s, transform 0.2s',
                willChange: 'box-shadow, border-color, background, transform',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                fontVariantNumeric: 'tabular-nums',
              }}
              placeholder="Enter a number"
              aria-describedby="standardNumberHelp"
              aria-invalid={error ? 'true' : 'false'}
              aria-errormessage={error ? 'error-message' : undefined}
            />
            <p id="standardNumberHelp" className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              e.g., 123,456
            </p>
          </div>
          <div>
            <label htmlFor="burmeseNumber" className="block text-base font-medium mb-1">Burmese Number</label>
            <textarea
              id="burmeseNumber"
              value={burmeseNumber}
              onChange={handleBurmeseInput}
              className={`block w-full p-3 text-lg rounded-md border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 resize-y ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-800'} shadow-sm hover:shadow-md focus:shadow-lg focus:border-blue-400 focus:scale-[1.025]'}`}
              style={{
                transition: 'box-shadow 0.3s, border-color 0.3s, background 0.3s, transform 0.2s',
                willChange: 'box-shadow, border-color, background, transform',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
                minHeight: '48px',
                maxHeight: '200px',
                height: 'auto',
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
            <p id="burmeseNumberHelp" className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              e.g., တစ်သိန်း နှစ်ထောင်
            </p>
          </div>
        </div>
        {error && (
          <p id="error-message" className="mt-6 text-red-600 dark:text-red-400 text-center">
            {error}
          </p>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={clearInputs}
            className="flex-1 px-4 py-3 text-lg font-semibold rounded-md bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}