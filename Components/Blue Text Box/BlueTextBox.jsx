import { useEffect, useState, useRef, useCallback } from "react";
import {
  Input,
  FieldValueList,
  Text,
  Configuration,
} from "@pega/cosmos-react-core";
import StyledBlueTextBoxWrapper from "./styles";
import handleEvent from "./event-handler";

/**
 * BlueTextBox — A custom Pega Constellation text input
 * with a vibrant blue background and white text.
 *
 * Supports edit mode, display-only mode, labels-left mode,
 * validation messages, and full Pega DX API integration.
 */
export default function BlueTextBox(props) {
  const {
    getPConnect,
    value = "",
    placeholder = "Enter text...",
    disabled = false,
    readOnly = false,
    required = false,
    label = "Blue Text Box",
    helperText = "",
    validatemessage = "",
    hideLabel = false,
    displayMode = "",
    onChange,
    onBlur,
    testId = "blue-text-box",
  } = props;

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = pConn.getStateProps().value;

  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef(null);

  // Keep local state in sync with Pega store value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change — update local state immediately for responsive typing
  const handleChange = useCallback(
    (event) => {
      const newValue = event.target.value;
      setInputValue(newValue);

      if (onChange) {
        onChange(event);
      }
    },
    [onChange]
  );

  // Handle blur — persist value to Pega store and trigger validation
  const handleBlur = useCallback(
    (event) => {
      const newValue = event.target.value;
      handleEvent(actions, "changeNblur", propName, newValue);

      if (onBlur) {
        onBlur(event);
      }
    },
    [actions, propName, onBlur]
  );

  // ───────── Display Mode: LABELS_LEFT ─────────
  if (displayMode === "LABELS_LEFT") {
    const displayValue = value || "---";
    return (
      <StyledBlueTextBoxWrapper data-testid={testId}>
        <FieldValueList
          variant="stacked"
          data-testid={`${testId}-field-list`}
          fields={[
            {
              id: "1",
              name: hideLabel ? "" : label,
              value: (
                <Text variant="h1" as="span">
                  {displayValue}
                </Text>
              ),
            },
          ]}
        />
      </StyledBlueTextBoxWrapper>
    );
  }

  // ───────── Display Mode: DISPLAY_ONLY ─────────
  if (displayMode === "DISPLAY_ONLY") {
    const displayValue = value || "---";
    return (
      <StyledBlueTextBoxWrapper data-testid={testId}>
        <Text variant="h1" as="span" data-testid={`${testId}-display`}>
          {displayValue}
        </Text>
      </StyledBlueTextBoxWrapper>
    );
  }

  // ───────── Edit Mode ─────────
  const hasError = !!validatemessage;

  return (
    <StyledBlueTextBoxWrapper data-testid={testId}>
      <Input
        ref={inputRef}
        type="text"
        label={label}
        labelHidden={hideLabel}
        info={hasError ? validatemessage : helperText}
        status={hasError ? "error" : undefined}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-label={hideLabel ? label : undefined}
        aria-invalid={hasError}
        aria-required={required}
      />
    </StyledBlueTextBoxWrapper>
  );
}

BlueTextBox.defaultProps = {
  value: "",
  placeholder: "Enter text...",
  disabled: false,
  readOnly: false,
  required: false,
  label: "Blue Text Box",
  helperText: "",
  validatemessage: "",
  hideLabel: false,
  displayMode: "",
  testId: "blue-text-box",
};
