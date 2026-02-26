import type { Meta, StoryObj } from '@storybook/react';
import PurpleButton from './PurpleButton';

const meta: Meta<typeof PurpleButton> = {
  title: 'Components/Omnicom_DemoLibrary_PurpleButton',
  component: PurpleButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Field label',
    },
    value: {
      control: 'text',
      description: 'Field value',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    required: {
      control: 'boolean',
      description: 'Is field required',
    },
    disabled: {
      control: 'boolean',
      description: 'Is field disabled',
    },
    readOnly: {
      control: 'boolean',
      description: 'Is field read-only',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PurpleButton>;

export const Default: Story = {
  args: {
    label: 'PurpleButton',
    value: '',
    placeholder: 'Enter value...',
    required: false,
    disabled: false,
    readOnly: false,
  },
};

export const WithValue: Story = {
  args: {
    label: 'PurpleButton',
    value: 'Sample value',
    required: false,
  },
};

export const Required: Story = {
  args: {
    label: 'PurpleButton',
    value: '',
    required: true,
    helperText: 'This field is required',
  },
};

export const Disabled: Story = {
  args: {
    label: 'PurpleButton',
    value: 'Disabled value',
    disabled: true,
  },
};

export const WithPConnect: Story = {
  args: {
    label: 'PurpleButton',
    value: 'Test value',
    getPConnect: () => {
  getValue: (prop: string) => '',
  setValue: (prop: string, value: any) => console.log(`setValue: ${prop} = ${value}`),
  getConfigProps: () => ({ value: 'testValue' }),
  getComponentConfig: () => ({ value: 'testValue' }),
  getChildren: () => [],
  getStateProps: () => ({}),
  getActionsApi: () => ({
    updateFieldValue: () => {},
    triggerFieldChange: () => {},
  }),
},
  },
};
