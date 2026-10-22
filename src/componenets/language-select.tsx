"use client";

import React from "react";
import {
  outputLanguageOptions,
  type OutputLanguage,
} from "@/constants/languages";

interface LanguageSelectProps {
  value: OutputLanguage;
  onChange: (language: OutputLanguage) => void;
  accentColor?: string;
  id?: string;
  className?: string;
}

export function LanguageSelect({
  value,
  onChange,
  accentColor = "#F2B441",
  id = "outputLanguage",
  className = "",
}: LanguageSelectProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block font-mono text-xs uppercase tracking-widest text-[#9A9CA5]"
        >
          Output Language
        </label>
        <span className="font-mono text-[10px] text-[#5C5F68]">
          Default: Auto-detect
        </span>
      </div>

      <div className="relative mt-2">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as OutputLanguage)}
          style={{
            borderColor: undefined,
          }}
          className="w-full appearance-none rounded-lg border border-white/10 bg-[#0F1115] px-4 py-3 pr-10 text-sm text-[#F5F3ED] outline-none transition-colors"
          onFocus={(e) => {
            e.currentTarget.style.borderColor = accentColor;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "";
          }}
        >
          {outputLanguageOptions.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-[#171A21] text-[#F5F3ED]"
            >
              {opt.label}
            </option>
          ))}
        </select>

        {/* Chevron icon */}
        <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9A9CA5]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
