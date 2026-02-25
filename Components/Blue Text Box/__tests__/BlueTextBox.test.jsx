import { render, screen, fireEvent } from "@testing-library/react";
import BlueTextBox from "../BlueTextBox";

// Mock getPConnect
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

  test("renders with label", () => {
    render(<BlueTextBox {...defaultProps} />);
    expect(screen.getByText("Test Blue Box")).toBeInTheDocument();
  });

  test("renders input with placeholder", () => {
    render(<BlueTextBox {...defaultProps} />);
    const input = screen.getByPlaceholderText("Type here...");
    expect(input).toBeInTheDocument();
  });

  test("displays initial value", () => {
    render(<BlueTextBox {...defaultProps} value="Hello World" />);
    const input = screen.getByDisplayValue("Hello World");
    expect(input).toBeInTheDocument();
  });

  test("calls Pega actions on blur", () => {
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

  test("renders as disabled when disabled prop is true", () => {
    render(<BlueTextBox {...defaultProps} disabled={true} />);
    const input = screen.getByPlaceholderText("Type here...");
    expect(input).toBeDisabled();
  });

  test("shows validation error message", () => {
    render(
      <BlueTextBox {...defaultProps} validatemessage="This field is required" />
    );
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  test("renders display-only mode", () => {
    render(
      <BlueTextBox
        {...defaultProps}
        displayMode="DISPLAY_ONLY"
        value="Display Value"
      />
    );
    expect(screen.getByText("Display Value")).toBeInTheDocument();
  });

  test("renders placeholder '---' when display mode has no value", () => {
    render(
      <BlueTextBox {...defaultProps} displayMode="DISPLAY_ONLY" value="" />
    );
    expect(screen.getByText("---")).toBeInTheDocument();
  });
});
