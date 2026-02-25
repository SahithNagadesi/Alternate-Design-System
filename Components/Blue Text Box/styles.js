import styled, { css } from "styled-components";

/**
 * Blue Text Box — Styled Wrapper
 *
 * Provides a vibrant blue (#1A73E8) background for the text input
 * with white text, custom focus/hover/disabled/error states.
 */
const StyledBlueTextBoxWrapper = styled.div(() => {
  return css`
    /* ===== Container ===== */
    margin: 0.5rem 0;
    position: relative;

    /* ===== Blue Background Input ===== */
    input[type="text"] {
      background-color: #1a73e8 !important;
      color: #ffffff !important;
      border: 2px solid #1558b0;
      border-radius: 8px;
      padding: 0.625rem 0.875rem;
      font-size: 1rem;
      font-family: inherit;
      line-height: 1.5;
      width: 100%;
      box-sizing: border-box;
      transition: background-color 0.2s ease-in-out,
        border-color 0.2s ease-in-out,
        box-shadow 0.2s ease-in-out;
      caret-color: #ffffff;

      /* ── Placeholder ── */
      &::placeholder {
        color: rgba(255, 255, 255, 0.6);
        opacity: 1;
      }

      /* ── Focus State ── */
      &:focus {
        background-color: #1558b0 !important;
        border-color: #90caf9;
        box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.35);
        outline: none;
        color: #ffffff !important;
      }

      /* ── Hover State ── */
      &:hover:not(:disabled):not(:read-only):not(:focus) {
        border-color: #90caf9;
        background-color: #1966d2 !important;
      }

      /* ── Disabled State ── */
      &:disabled {
        background-color: #a4c4f4 !important;
        color: rgba(255, 255, 255, 0.5) !important;
        border-color: #a4c4f4;
        cursor: not-allowed;
        opacity: 0.7;
      }

      /* ── Read-Only State ── */
      &:read-only {
        background-color: #2b7de9 !important;
        border-color: transparent;
        cursor: default;
      }
    }

    /* ===== Label ===== */
    label {
      color: #1a73e8;
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.375rem;
      display: block;
    }

    /* ===== Helper / Info Text ===== */
    .helper-text,
    [class*="HelperText"],
    small {
      font-size: 0.75rem;
      color: #5f6368;
      margin-top: 0.25rem;
    }

    /* ===== Error State ===== */
    [status="error"] input[type="text"],
    input[type="text"][aria-invalid="true"] {
      border-color: #d93025 !important;
      box-shadow: 0 0 0 3px rgba(217, 48, 37, 0.2);
      background-color: #1a73e8 !important;
    }

    [status="error"] input[type="text"]:focus,
    input[type="text"][aria-invalid="true"]:focus {
      border-color: #d93025 !important;
      box-shadow: 0 0 0 3px rgba(217, 48, 37, 0.35);
    }

    /* ===== Display Mode Text ===== */
    span[data-testid*="display"] {
      color: #1a73e8;
      font-weight: 500;
    }
  `;
});

export default StyledBlueTextBoxWrapper;
