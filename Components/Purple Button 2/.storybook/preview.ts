import type { Preview } from '@storybook/react';
import { ThemeProvider } from 'styled-components';

const pegaTheme = {
  base: {
    palette: {
      primary: '#004080',
      secondary: '#0076D6',
      success: '#43A047',
      warning: '#FB8C00',
      error: '#E53935',
      info: '#039BE5',
      neutral: '#616161',
      background: '#FFFFFF',
      text: '#212121',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },
  },
};

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={pegaTheme}>
        <div style={{ padding: '2rem' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;
