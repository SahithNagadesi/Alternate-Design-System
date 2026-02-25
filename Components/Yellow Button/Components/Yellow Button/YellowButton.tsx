/**
 * YellowButton – Presentational Component
 *
 * Pure React component with zero Pega dependencies.
 * All Pega wiring lives in index.tsx (the bridge).
 */

import { useState, useCallback } from "react";
import styles from "./YellowButton.module.css";

export interface YellowButtonProps {
  /** Button label text */
  label?: string;
  /** Click handler */
  onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Button size variant */
  size?: "small" | "medium" | "large";
  /** Colour variant */
  variant?: "primary" | "secondary";
  /** Show the forward-arrow icon */
  showIcon?: boolean;
  /** data-testid for automation */
  testId?: string;
}

const YellowButton: React.FC<YellowButtonProps> = ({
  label = "Proceed",
  onClick,
  disabled = false,
  size = "medium",
  variant = "primary",
  showIcon = true,
  testId = "yellow-button",
}) => {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  // ── Handlers ──
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) onClick?.(e);
    },
    [disabled, onClick]
  );

  // ── Compute CSS class list ──
  const classList = [
    styles.yellowButton,
    styles[size],
    styles[variant],
    disabled ? styles.disabled : "",
    hovered && !disabled ? styles.hovered : "",
    pressed && !disabled ? styles.pressed : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classList}
      onClick={handleClick}
      disabled={disabled}
      data-testid={testId}
      aria-label={label}
      aria-disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      <span className={styles.label}>{label}</span>

      {showIcon && (
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
      )}
    </button>
  );
};

export default YellowButton;
