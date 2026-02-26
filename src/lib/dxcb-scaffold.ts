/**
 * DXCB Scaffold Generator
 *
 * Generates a complete DXCB (DX Component Builder) project structure for
 * Pega Constellation custom components with Storybook support.
 */

import type { ComponentMetadata } from "@/types/project-metadata";

interface ScaffoldFile {
  path: string;
  content: string;
}

export function generateDXCBScaffold(
  metadata: ComponentMetadata
): ScaffoldFile[] {
  const {
    organizationName = "MyOrg",
    libraryName = "MyLib",
    componentName = "MyComponent",
    componentVersion = "01.01.01",
    projectDescription = "",
    componentType = "Field",
    componentSubtype = "TextInput",
    dxcbVersion = "25.1.10",
    pegaPlatformVersion = "25",
    libraryMode = true,
    rulesetName = "",
    rulesetVersion = "",
  } = metadata;

  // Component folder name: Org_Lib_ComponentName
  const componentFolder = `${organizationName}_${libraryName}_${componentName}`;
  const componentBasePath = `src/components/${componentFolder}`;

  const files: ScaffoldFile[] = [];

  // ── package.json ──────────────────────────────────────────────────────
  files.push({
    path: "package.json",
    content: JSON.stringify(
      {
        name: `${organizationName.toLowerCase()}-${libraryName.toLowerCase()}-${componentName.toLowerCase()}`,
        version: componentVersion,
        description: projectDescription || `${componentName} - Pega Constellation Component`,
        main: "index.js",
        scripts: {
          start: "npm run build -- --watch",
          build: "node node_modules/@pega/dxcb/lib/build/run.js",
          storybook: "storybook dev -p 6006",
          "build-storybook": "storybook build",
        },
        dependencies: {
          "@pega/cosmos-react-core": "^3.0.0",
          "styled-components": "^5.3.11",
          react: "^18.2.0",
          "react-dom": "^18.2.0",
        },
        devDependencies: {
          "@pega/dxcb": `^${dxcbVersion}`,
          "@storybook/react": "^8.0.0",
          "@storybook/react-vite": "^8.0.0",
          "@storybook/addon-essentials": "^8.0.0",
          "@storybook/addon-interactions": "^8.0.0",
          "@storybook/addon-links": "^8.0.0",
          storybook: "^8.0.0",
          "@types/react": "^18.2.0",
          "@types/react-dom": "^18.2.0",
          "@types/styled-components": "^5.1.26",
          typescript: "^5.0.0",
          vite: "^5.0.0",
        },
      },
      null,
      2
    ),
  });

  // ── tasks.config.json ─────────────────────────────────────────────────
  files.push({
    path: "tasks.config.json",
    content: JSON.stringify(
      {
        platform: pegaPlatformVersion,
        components: [
          {
            organization: organizationName,
            library: libraryName,
            component: componentName,
            type: componentType.toUpperCase(),
            ...(componentSubtype && { subtype: componentSubtype }),
            version: componentVersion,
            ...(rulesetName && { ruleset: rulesetName }),
            ...(rulesetVersion && { rulesetVersion }),
            libraryMode,
          },
        ],
      },
      null,
      2
    ),
  });

  // ── tsconfig.json ─────────────────────────────────────────────────────
  files.push({
    path: "tsconfig.json",
    content: JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          jsx: "react-jsx",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
        },
        include: ["src/**/*"],
        exclude: ["node_modules", "dist"],
      },
      null,
      2
    ),
  });

  // ── .storybook/main.ts ────────────────────────────────────────────────
  files.push({
    path: ".storybook/main.ts",
    content: `import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
`,
  });

  // ── .storybook/preview.ts ─────────────────────────────────────────────
  files.push({
    path: ".storybook/preview.ts",
    content: `import type { Preview } from '@storybook/react';
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
`,
  });

  // ── src/components/<Org_Lib_Comp>/index.ts ───────────────────────────
  files.push({
    path: `${componentBasePath}/index.ts`,
    content: `export { default } from './${componentName}';
`,
  });

  // ── src/components/<Org_Lib_Comp>/config.json ────────────────────────
  const configProperties = getConfigPropertiesByType(componentType, componentSubtype);
  files.push({
    path: `${componentBasePath}/config.json`,
    content: JSON.stringify(
      {
        name: componentName,
        label: componentName,
        description: projectDescription || `${componentName} component`,
        organization: organizationName,
        library: libraryName,
        version: componentVersion,
        type: componentType.toUpperCase(),
        ...(componentSubtype && { subtype: componentSubtype }),
        properties: configProperties,
      },
      null,
      2
    ),
  });

  // ── src/components/<Org_Lib_Comp>/<Comp>.tsx ─────────────────────────
  const componentCode = generateComponentCode(componentName, componentType, componentSubtype);
  files.push({
    path: `${componentBasePath}/${componentName}.tsx`,
    content: componentCode,
  });

  // ── src/components/<Org_Lib_Comp>/<Comp>.styles.ts ───────────────────
  files.push({
    path: `${componentBasePath}/${componentName}.styles.ts`,
    content: `import styled from 'styled-components';

export const StyledWrapper = styled.div\`
  display: flex;
  flex-direction: column;
  gap: \${({ theme }) => theme?.base?.spacing?.sm || '8px'};
  font-family: 'Open Sans', sans-serif;
\`;

export const StyledLabel = styled.label\`
  font-size: 14px;
  font-weight: 600;
  color: \${({ theme }) => theme?.base?.palette?.text || '#212121'};
\`;

export const StyledInput = styled.input\`
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;

  &:focus {
    border-color: \${({ theme }) => theme?.base?.palette?.primary || '#004080'};
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
\`;

export const StyledError = styled.div\`
  color: \${({ theme }) => theme?.base?.palette?.error || '#E53935'};
  font-size: 12px;
  margin-top: 4px;
\`;
`,
  });

  // ── src/components/<Org_Lib_Comp>/demo.stories.tsx ───────────────────
  const storyCode = generateStoryCode(componentName, componentFolder, componentType);
  files.push({
    path: `${componentBasePath}/demo.stories.tsx`,
    content: storyCode,
  });

  return files;
}

function getConfigPropertiesByType(type: string, subtype: string): any[] {
  const baseProps = [
    {
      name: "label",
      label: "Label",
      type: "string",
      defaultValue: "",
    },
    {
      name: "required",
      label: "Required",
      type: "boolean",
      defaultValue: false,
    },
    {
      name: "disabled",
      label: "Disabled",
      type: "boolean",
      defaultValue: false,
    },
    {
      name: "readOnly",
      label: "Read Only",
      type: "boolean",
      defaultValue: false,
    },
  ];

  if (type === "Field") {
    return [
      ...baseProps,
      {
        name: "value",
        label: "Value",
        type: "string",
        defaultValue: "",
      },
      {
        name: "placeholder",
        label: "Placeholder",
        type: "string",
        defaultValue: "",
      },
      {
        name: "helperText",
        label: "Helper Text",
        type: "string",
        defaultValue: "",
      },
    ];
  }

  if (type === "Template") {
    return [
      {
        name: "title",
        label: "Title",
        type: "string",
        defaultValue: "",
      },
      {
        name: "children",
        label: "Children",
        type: "children",
        defaultValue: [],
      },
    ];
  }

  if (type === "Widget") {
    return [
      {
        name: "title",
        label: "Title",
        type: "string",
        defaultValue: "",
      },
      {
        name: "caseID",
        label: "Case ID",
        type: "string",
        defaultValue: "",
      },
    ];
  }

  return baseProps;
}

function generateComponentCode(
  componentName: string,
  type: string,
  subtype: string
): string {
  if (type === "Field") {
    return `import React, { useState } from 'react';
import { StyledWrapper, StyledLabel, StyledInput, StyledError } from './${componentName}.styles';

export interface ${componentName}Props {
  getPConnect?: () => any;
  label?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  helperText?: string;
  testId?: string;
}

const ${componentName}: React.FC<${componentName}Props> = (props) => {
  const {
    getPConnect,
    label = '',
    value: initialValue = '',
    placeholder = '',
    required = false,
    disabled = false,
    readOnly = false,
    helperText = '',
    testId = '${componentName}',
  } = props;

  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Validate if required
    if (required && !newValue) {
      setError('This field is required');
    } else {
      setError('');
    }

    // If using PConnect, update the value
    if (getPConnect) {
      const pConn = getPConnect();
      const propName = pConn?.getComponentConfig?.()?.value || 'value';
      pConn?.setValue?.(propName, newValue);
    }
  };

  return (
    <StyledWrapper data-testid={testId}>
      {label && (
        <StyledLabel>
          {label}
          {required && <span style={{ color: 'red' }}> *</span>}
        </StyledLabel>
      )}
      <StyledInput
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        aria-label={label}
        aria-required={required}
        aria-invalid={!!error}
      />
      {error && <StyledError>{error}</StyledError>}
      {helperText && !error && (
        <div style={{ fontSize: '12px', color: '#666' }}>{helperText}</div>
      )}
    </StyledWrapper>
  );
};

export default ${componentName};
`;
  }

  if (type === "Template") {
    return `import React from 'react';
import { StyledWrapper } from './${componentName}.styles';

export interface ${componentName}Props {
  getPConnect?: () => any;
  title?: string;
  children?: React.ReactNode;
  testId?: string;
}

const ${componentName}: React.FC<${componentName}Props> = (props) => {
  const {
    getPConnect,
    title = '',
    children,
    testId = '${componentName}',
  } = props;

  // If using PConnect, render child components
  let renderedChildren = children;
  if (getPConnect && !children) {
    const pConn = getPConnect();
    const childConfigs = pConn?.getChildren?.() || [];
    // In a real implementation, you would render PConnect children here
    renderedChildren = <div>Child components would render here</div>;
  }

  return (
    <StyledWrapper data-testid={testId}>
      {title && <h2>{title}</h2>}
      <div className="template-content">{renderedChildren}</div>
    </StyledWrapper>
  );
};

export default ${componentName};
`;
  }

  if (type === "Widget") {
    return `import React, { useEffect, useState } from 'react';
import { StyledWrapper } from './${componentName}.styles';

export interface ${componentName}Props {
  getPConnect?: () => any;
  title?: string;
  caseID?: string;
  testId?: string;
}

const ${componentName}: React.FC<${componentName}Props> = (props) => {
  const {
    getPConnect,
    title = '',
    caseID = '',
    testId = '${componentName}',
  } = props;

  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (caseID && getPConnect) {
      setLoading(true);
      const pConn = getPConnect();
      // In a real implementation, you would fetch case data via PConnect
      // For now, just simulate loading
      setTimeout(() => {
        setCaseData({ id: caseID, status: 'Open' });
        setLoading(false);
      }, 1000);
    }
  }, [caseID, getPConnect]);

  return (
    <StyledWrapper data-testid={testId}>
      {title && <h2>{title}</h2>}
      <div className="widget-content">
        {loading && <p>Loading...</p>}
        {caseData && (
          <div>
            <p>Case ID: {caseData.id}</p>
            <p>Status: {caseData.status}</p>
          </div>
        )}
        {!loading && !caseData && <p>No case data available</p>}
      </div>
    </StyledWrapper>
  );
};

export default ${componentName};
`;
  }

  // Default fallback
  return `import React from 'react';
import { StyledWrapper } from './${componentName}.styles';

export interface ${componentName}Props {
  getPConnect?: () => any;
  testId?: string;
}

const ${componentName}: React.FC<${componentName}Props> = (props) => {
  const { testId = '${componentName}' } = props;

  return (
    <StyledWrapper data-testid={testId}>
      <div>${componentName} Component</div>
    </StyledWrapper>
  );
};

export default ${componentName};
`;
}

function generateStoryCode(
  componentName: string,
  componentFolder: string,
  type: string
): string {
  const importPath = `./${componentName}`;

  const mockPConnect = `{
  getValue: (prop: string) => '',
  setValue: (prop: string, value: any) => console.log(\`setValue: \${prop} = \${value}\`),
  getConfigProps: () => ({ value: 'testValue' }),
  getComponentConfig: () => ({ value: 'testValue' }),
  getChildren: () => [],
  getStateProps: () => ({}),
  getActionsApi: () => ({
    updateFieldValue: () => {},
    triggerFieldChange: () => {},
  }),
}`;

  if (type === "Field") {
    return `import type { Meta, StoryObj } from '@storybook/react';
import ${componentName} from '${importPath}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Components/${componentFolder}',
  component: ${componentName},
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
type Story = StoryObj<typeof ${componentName}>;

export const Default: Story = {
  args: {
    label: '${componentName}',
    value: '',
    placeholder: 'Enter value...',
    required: false,
    disabled: false,
    readOnly: false,
  },
};

export const WithValue: Story = {
  args: {
    label: '${componentName}',
    value: 'Sample value',
    required: false,
  },
};

export const Required: Story = {
  args: {
    label: '${componentName}',
    value: '',
    required: true,
    helperText: 'This field is required',
  },
};

export const Disabled: Story = {
  args: {
    label: '${componentName}',
    value: 'Disabled value',
    disabled: true,
  },
};

export const WithPConnect: Story = {
  args: {
    label: '${componentName}',
    value: 'Test value',
    getPConnect: () => ${mockPConnect},
  },
};
`;
  }

  if (type === "Template") {
    return `import type { Meta, StoryObj } from '@storybook/react';
import ${componentName} from '${importPath}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Templates/${componentFolder}',
  component: ${componentName},
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ${componentName}>;

export const Default: Story = {
  args: {
    title: '${componentName} Template',
    children: <div style={{ padding: '1rem' }}>Template content goes here</div>,
  },
};

export const WithMultipleChildren: Story = {
  args: {
    title: 'Multi-section Template',
    children: (
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <section>Section 1</section>
        <section>Section 2</section>
        <section>Section 3</section>
      </div>
    ),
  },
};

export const WithPConnect: Story = {
  args: {
    title: '${componentName} with PConnect',
    getPConnect: () => ${mockPConnect},
  },
};
`;
  }

  // Widget or default
  return `import type { Meta, StoryObj } from '@storybook/react';
import ${componentName} from '${importPath}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Widgets/${componentFolder}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ${componentName}>;

export const Default: Story = {
  args: {
    title: '${componentName} Widget',
    caseID: 'C-1234',
  },
};

export const WithPConnect: Story = {
  args: {
    title: '${componentName} with PConnect',
    caseID: 'C-5678',
    getPConnect: () => ${mockPConnect},
  },
};
`;
}
