"use client";
import React, { useState } from "react";
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { css } from "@/lib/css";
import type { Style } from "@/lib/css";

export type { Style };
export { css };

interface BoxProps {
  as?: "div" | "span"; style?: Style; styleHover?: Style;
  onClick?: (e: MouseEvent | KeyboardEvent) => void; noButton?: boolean; children?: ReactNode;
  [key: string]: unknown;
}
export function Box({ as = "div", style, styleHover, onClick, noButton, children, ...rest }: BoxProps) {
  const [hover, setHover] = useState(false);
  const Tag = as;
  const merged: CSSProperties = { ...css(style), ...(hover && styleHover ? css(styleHover) : {}) };
  const hoverProps = styleHover ? { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) } : {};
  const a11y = onClick && !noButton ? {
    role: "button" as const, tabIndex: 0,
    onKeyDown: (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(e); } },
  } : {};
  return <Tag style={merged} onClick={onClick} {...hoverProps} {...a11y} {...(rest as Record<string, unknown>)}>{children}</Tag>;
}
