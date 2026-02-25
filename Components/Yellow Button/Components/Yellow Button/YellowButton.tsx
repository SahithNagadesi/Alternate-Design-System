/**
 * YellowButton – Presentational Component
 *
 * Pure React component with zero Pega dependencies.
 * All Pega wiring lives in index.tsx (the bridge).
 *
 * @version 2.2.0
 */

import React, { useState, useCallback, useRef } from "react";
import styles from "./YellowButton.module.css";

/* ─── Public Props ─── */
export interface YellowButtonProps {
  /** Button label text */
  label?: string;
  /** Click handler */
  onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is read-only (renders as non-interactive) */
  readOnly?: boolean;
  /** Button size variant */
  size?: "small" | "medium" | "large";
  /** Colour variant */
  variant?: "primary" | "secondary";
  /** Show the forward-arrow icon */
  showIcon?: boolean;
  /** Show loading spinner and disable interaction */
  loading?: boolean;
  /** Tooltip text displayed on hover */
  tooltip?: string;
  /** Full-width button */
  fullWidth?: boolean;
  /** data-testid for automation */
  testId?: string;
}

/* ─── Arrow Icon ─── */
const ArrowIcon: React.FC = () => (
  <svg
    className={styles.icon}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="13 6 19 12 13 18" />
  </svg>
);

/* ─── Spinner ─── */
const Spinner: React.FC = () => (
  <span className={styles.spinner} role="status" aria-label="Loading">
    <span className={styles.srOnly}>Loading…</span>
  </span>
);

/* ─── Component ─── */
export const YellowButton: React.FC<YellowButtonProps> = ({
  label = "Proceed",
  onClick,
  disabled = false,
  readOnly = false,
  size = "medium",
  variant = "primary",
  showIcon = true,
  loading = false,
  tooltip = "",
  fullWidth = false,
  testId = "yellow-button",
}) => {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleCounter = useRef(0);

  const isDisabled = disabled || readOnly || loading;

  /* ── Ripple effect ── */
  const spawnRipple = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled || !buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      rippleCounter.current += 1;
      setRipple({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        id: rippleCounter.current,
      });
      setTimeout(() => setRipple(null), 500);
    },
    [isDisabled]
  );

  /* ── Click handler ── */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        spawnRipple(e);
        onClick?.(e);
      }
    },
    [isDisabled, onClick, spawnRipple]
  );

  /* ── Keyboard support ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === "Enter" || e.key === " ") && !isDisabled) {
        e.preventDefault();
        setPressed(true);
      }
    },
    [isDisabled]
  );

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === "Enter" || e.key === " ") && !isDisabled) {
        setPressed(false);
        buttonRef.current?.click();
      }
    },
    [isDisabled]
  );

  /* ── Build class list ── */
  const classList = [
    styles.yellowButton,
    styles[size],
    styles[variant],
    isDisabled ? styles.disabled : "",
    loading ? styles.loading : "",
    hovered && !isDisabled ? styles.hovered : "",
    pressed && !isDisabled ? styles.pressed : "",
    fullWidth ? styles.fullWidth : "",
  ]
    .filter(Boolean)
    .join(" ");

  /* ── Button element ── */
  const buttonElement = (
    <button
      ref={buttonRef}
      type="button"
      className={classList}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      disabled={isDisabled}
      data-testid={testId}
      aria-label={loading ? `${label} loading` : label}
      aria-disabled={isDisabled}
      aria-busy={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => !isDisabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {/* Ripple */}
      {ripple && (
        <span
          key={ripple.id}
          className={styles.ripple}
          style={{ left: ripple.x, top: ripple.y }}
        />
      )}

      {loading && <Spinner />}
      <span className={styles.label}>{label}</span>
      {showIcon && !loading && <ArrowIcon />}
    </button>
  );

  /* ── Tooltip wrap ── */
  if (tooltip) {
    return (
      <span className={styles.tooltipWrapper}>
        {buttonElement}
        <span className={styles.tooltipText} role="tooltip">
          {tooltip}
        </span>
      </span>
    );
  }

  return buttonElement;
};

export default YellowButton;
