import type { Meta, StoryObj } from "@storybook/react";
import { YellowButton } from "./YellowButton";

const meta: Meta<typeof YellowButton> = {
  title: "Components/YellowButton",
  component: YellowButton,
  argTypes: {
    label: {
      control: "text",
      description: "Button label text",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
    size: {
      control: { type: "select" },
      options: ["small", "medium", "large"],
      description: "Button size variant",
    },
    onClick: {
      action: "clicked",
      description: "Click handler",
    },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof YellowButton>;

/** Default Proceed button */
export const Default: Story = {
  args: {
    label: "Proceed",
    disabled: false,
    size: "medium",
  },
};

/** Small-sized Proceed button */
export const Small: Story = {
  args: {
    label: "Proceed",
    disabled: false,
    size: "small",
  },
};

/** Large-sized Proceed button */
export const Large: Story = {
  args: {
    label: "Proceed",
    disabled: false,
    size: "large",
  },
};

/** Disabled state */
export const Disabled: Story = {
  args: {
    label: "Proceed",
    disabled: true,
    size: "medium",
  },
};

/** Custom label example */
export const CustomLabel: Story = {
  args: {
    label: "Continue →",
    disabled: false,
    size: "medium",
  },
};

/** All variants side by side */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
      <YellowButton label="Proceed" size="small" />
      <YellowButton label="Proceed" size="medium" />
      <YellowButton label="Proceed" size="large" />
      <YellowButton label="Proceed" size="medium" disabled />
    </div>
  ),
};
