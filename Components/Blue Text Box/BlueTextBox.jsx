import { useEffect, useState, useRef } from "react";
import {
  Input,
  FieldValueList,
  Text,
  Configuration,
} from "@pega/cosmos-react-core";
import StyledBlueTextBoxWrapper from "./styles";
import handleEvent from "./event-handler";

export default function BlueTextBox(props) {
  const {
    getPConnect,
    value = "",
    placeholder = "",
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

  // Sync with Pega value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle change event
  const handleChange = (event) => {
    const newValue = event.target.value;
    setInputValue(newValue);

    if (onChange) {
      onChange(event);
    }
  };

  // Handle blur - update Pega store
  const handleBlur = (event) => {
    const newValue = event.target.value;

    handleEvent(actions, "changeNblur", propName, newValue);

    if (onBlur) {
      onBlur(event);
    }
  };

  // ----- Display Mode (Read-Only View) -----
  if (displayMode === "LABELS_LEFT" || displayMode === "DISPLAY_ONLY") {
    const displayValue = value || "---";

    if (displayMode === "LABELS_LEFT") {
      return (
        <StyledBlueTextBoxWrapper>
          <FieldValueList
            variant="stacked"
            data-testid={testId}
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

    return (
      <StyledBlueTextBoxWrapper>
        <Text variant="h1" as="span" data-testid={testId}>
          {displayValue}
        </Text>
      </StyledBlueTextBoxWrapper>
    );
  }

  // ----- Edit Mode -----
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
      />
    </StyledBlueTextBoxWrapper>
  );
}

BlueTextBox.defaultProps = {
  value: "",
  placeholder: "",
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
