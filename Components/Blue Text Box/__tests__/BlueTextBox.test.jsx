import { render, screen, fireEvent } from "@testing-library/react";
import BlueTextBox from "../BlueTextBox";

// ── Mock Pega getPConnect ──
const mockActions = {
  updateFieldValue: jest.fn(),
  triggerFieldChange: jest.fn(),
};

const mockGetPConnect = () => ({
  getActionsApi: () => mockActions,
  getStateProps: () => ({ value: ".TestProperty" }),
});

const defaultProps = {
  getPConnect: mockGetPConnect,
  label: "Test Blue Box",
  value: "",
  placeholder: "Type here...",
  testId: "blue-text-box",
};

describe("BlueTextBox Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ──
  test("renders with the correct label", () => {
    render(<BlueTextBox {...defaultProps} />);
    expect(screen.getByText("Test Blue Box")).toBeInTheDocument();
  });

  test("renders input with placeholder text", () => {
    render(<BlueTextBox {...defaultProps} />);
    const input = screen.getByPlaceholderText("Type here...");
    expect(input).toBeInTheDocument();
  });

  test("displays the bound value", () => {
    render(<BlueTextBox {...defaultProps} value="Hello World" />);
    expect(screen.getByDisplayValue("Hello World")).toBeInTheDocument();
  });

  test("renders with default placeholder when none provided", () => {
    const { placeholder, ...propsWithoutPlaceholder } = defaultProps;
    render(<BlueTextBox {...propsWithoutPlaceholder} />);
    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
  });

  // ── User Interaction ──
  test("updates input value on typing", () => {
    render(<BlueTextBox {...defaultProps} />);
    const input = screen.getByPlaceholderText("Type here...");

    fireEvent.change(input, { target: { value: "Typing test" } });
    expect(input.value).toBe("Typing test");
  });

  test("calls Pega updateFieldValue and triggerFieldChange on blur", () => {
    render(<BlueTextBox {...defaultProps} />);
    const input = screen.getByPlaceholderText("Type here...");

    fireEvent.change(input, { target: { value: "New Value" } });
    fireEvent.blur(input);

    expect(mockActions.updateFieldValue).toHaveBeenCalledWith(
      ".TestProperty",
      "New Value"
    );
    expect(mockActions.triggerFieldChange).toHaveBeenCalledWith(
      ".TestProperty",
      "New Value"
    );
  });

  test("calls custom onChange callback when provided", () => {
    const onChangeMock = jest.fn();
    render(<BlueTextBox {...defaultProps} onChange={onChangeMock} />);
    const input = screen.getByPlaceholderText("Type here...");

    fireEvent.change(input, { target: { value: "callback test" } });
    expect(onChangeMock).toHaveBeenCalledTimes(1);
  });

  test("calls custom onBlur callback when provided", () => {
    const onBlurMock = jest.fn();
    render(<BlueTextBox {...defaultProps} onBlur={onBlurMock} />);
    const input = screen.getByPlaceholderText("Type here...");

    fireEvent.blur(input);
    expect(onBlurMock).toHaveBeenCalledTimes(1);
  });

  // ── States ──
  test("renders as disabled when disabled prop is true", () => {
    render(<BlueTextBox {...defaultProps} disabled={true} />);
    const input = screen.getByPlaceholderText("Type here...");
    expect(input).toBeDisabled();
  });

  test("renders as read-only when readOnly prop is true", () => {
    render(<BlueTextBox {...defaultProps} readOnly={true} />);
    const input = screen.getByPlaceholderText("Type here...");
    expect(input).toHaveAttribute("readOnly");
  });

  // ── Validation ──
  test("shows validation error message", () => {
    render(
      <BlueTextBox {...defaultProps} validatemessage="This field is required" />
    );
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  test("shows helper text when no error", () => {
    render(
      <BlueTextBox {...defaultProps} helperText="Enter your full name" />
    );
    expect(screen.getByText("Enter your full name")).toBeInTheDocument();
  });

  // ── Display Modes ──
  test("renders DISPLAY_ONLY mode with value", () => {
    render(
      <BlueTextBox
        {...defaultProps}
        displayMode="DISPLAY_ONLY"
        value="Display Value"
      />
    );
    expect(screen.getByText("Display Value")).toBeInTheDocument();
  });

  test("renders DISPLAY_ONLY mode with '---' when value is empty", () => {
    render(
      <BlueTextBox {...defaultProps} displayMode="DISPLAY_ONLY" value="" />
    );
    expect(screen.getByText("---")).toBeInTheDocument();
  });

  test("renders LABELS_LEFT mode with value", () => {
    render(
      <BlueTextBox
        {...defaultProps}
        displayMode="LABELS_LEFT"
        value="Label Value"
      />
    );
    expect(screen.getByText("Label Value")).toBeInTheDocument();
  });

  test("renders LABELS_LEFT mode with '---' when value is empty", () => {
    render(
      <BlueTextBox {...defaultProps} displayMode="LABELS_LEFT" value="" />
    );
    expect(screen.getByText("---")).toBeInTheDocument();
  });
});
