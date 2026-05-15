"use client";

import { motion } from "framer-motion";
import {
  VIDEO_ASPECT_OPTIONS,
  type ImageSize,
} from "@/lib/production";

interface AspectRatioPickerProps {
  value: ImageSize;
  onChange: (size: ImageSize) => void;
  disabled?: boolean;
}

export function AspectRatioPicker({
  value,
  onChange,
  disabled,
}: AspectRatioPickerProps) {
  return (
    <motion.div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Aspect ratio
      </p>
      <div className="grid grid-cols-3 gap-2">
        {VIDEO_ASPECT_OPTIONS.map((option) => {
          const selected = value === option.imageSize;
          const isPortrait = option.imageSize === "720x1280";
          const isSquare = option.imageSize === "960x960";
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.imageSize)}
              className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 transition-all ${
                selected
                  ? "border-violet-500/60 bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/40"
                  : "border-white/5 bg-white/5 text-zinc-400 hover:border-white/15 hover:bg-white/10"
              }`}
            >
              <span
                className={`block rounded-sm border-2 ${
                  selected ? "border-violet-400" : "border-zinc-600"
                } ${
                  isPortrait
                    ? "h-8 w-[18px]"
                    : isSquare
                      ? "h-6 w-6"
                      : "h-[18px] w-8"
                }`}
              />
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-center text-[10px] leading-tight opacity-70">
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
