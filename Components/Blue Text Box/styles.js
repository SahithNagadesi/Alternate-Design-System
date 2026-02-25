import styled, { css } from "styled-components";

const StyledBlueTextBoxWrapper = styled.div(() => {
  return css`
    /* ===== Blue Text Box Styles ===== */
    margin: 0.5rem 0;

    /* Blue background for the input field */
    input[type="text"] {
      background-color: #1a73e8 !important;
      color: #ffffff !important;
      border: 2px solid #1558b0;
      border-radius: 8px;
      padding: 0.625rem 0.875rem;
      font-size: 1rem;
      line-height: 1.5;
      transition: all 0.2s ease-in-out;
      caret-color: #ffffff;

      /* Placeholder styling */
      &::placeholder {
        color: rgba(255, 255, 255, 0.65);
        opacity: 1;
      }

      /* Focus state */
      &:focus {
        background-color: #1558b0 !important;
        border-color: #90caf9;
        box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.35);
        outline: none;
        color: #ffffff !important;
      }

      /* Hover state */
      &:hover:not(:disabled):not(:read-only) {
        border-color: #90caf9;
        background-color: #1966d2 !important;
      }

      /* Disabled state */
      &:disabled {
        background-color: #a4c4f4 !important;
        color: rgba(255, 255, 255, 0.5) !important;
        border-color: #a4c4f4;
        cursor: not-allowed;
      }

      /* Read-only state */
      &:read-only {
        background-color: #2b7de9 !important;
        border-color: transparent;
        cursor: default;
      }
    }

    /* Label styling */
    label {
      color: #1a73e8;
      font-weight: 600;
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
    }

    /* Helper text styling */
    .helper-text,
    [class*="HelperText"],
    small {
      font-size: 0.75rem;
      color: #5f6368;
      margin-top: 0.25rem;
    }

    /* Error state styling */
    [status="error"] input[type="text"],
    input[type="text"][aria-invalid="true"] {
      border-color: #d93025 !important;
      box-shadow: 0 0 0 2px rgba(217, 48, 37, 0.25);
    }
  `;
});

export default StyledBlueTextBoxWrapper;
