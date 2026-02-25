import React from "react";

export interface YellowButtonProps {
  /** Button label text */
  label?: string;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Button size variant */
  size?: "small" | "medium" | "large";
  /** Optional custom className */
  className?: string;
}

const sizeStyles: Record<string, React.CSSProperties> = {
  small: {
    padding: "8px 20px",
    fontSize: "14px",
  },
  medium: {
    padding: "12px 32px",
    fontSize: "16px",
  },
  large: {
    padding: "16px 44px",
    fontSize: "18px",
  },
};

export const YellowButton: React.FC<YellowButtonProps> = ({
  label = "Proceed",
  onClick,
  disabled = false,
  size = "medium",
  className,
}) => {
  const baseStyle: React.CSSProperties = {
    backgroundColor: disabled ? "#d4c76a" : "#FFD700",
    color: "#1a1a1a",
    border: "2px solid #ccac00",
    borderRadius: "8px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease-in-out",
    boxShadow: disabled ? "none" : "0 2px 6px rgba(255, 215, 0, 0.35)",
    opacity: disabled ? 0.6 : 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    ...sizeStyles[size],
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = "#FFC800";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 215, 0, 0.5)";
      e.currentTarget.style.transform = "translateY(-1px)";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = "#FFD700";
      e.currentTarget.style.boxShadow = "0 2px 6px rgba(255, 215, 0, 0.35)";
      e.currentTarget.style.transform = "translateY(0)";
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = "translateY(1px)";
      e.currentTarget.style.boxShadow = "0 1px 3px rgba(255, 215, 0, 0.3)";
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = "translateY(-1px)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 215, 0, 0.5)";
    }
  };

  return (
    <button
      type="button"
      style={baseStyle}
      onClick={onClick}
      disabled={disabled}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      aria-label={label}
    >
      {/* Arrow / Proceed icon */}
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        {label}
      </span>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="13 6 19 12 13 18" />
      </svg>
    </button>
  );
};

export default YellowButton;
