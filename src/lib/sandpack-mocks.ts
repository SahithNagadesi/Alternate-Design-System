/**
 * Sandpack Mock Modules
 *
 * Provides mock implementations of Pega-specific modules for in-browser
 * component preview using Sandpack. These mocks allow components to run
 * without actual Pega server connections.
 */

/**
 * Mock PConnect implementation
 * Simulates the PConnect API that Pega components receive as props
 */
const MOCK_PCONNECT_MODULE = `
// Mock PConnect implementation for Sandpack preview
const mockPConnect = {
  getValue: (propertyRef) => {
    console.log('[Mock PConnect] getValue:', propertyRef);
    return '';
  },
  setValue: (propertyRef, value) => {
    console.log('[Mock PConnect] setValue:', propertyRef, '=', value);
  },
  getConfigProps: () => {
    console.log('[Mock PConnect] getConfigProps');
    return {
      value: 'testValue',
      label: 'Test Label',
      placeholder: 'Enter value',
      required: false,
      disabled: false,
      readOnly: false,
    };
  },
  getComponentConfig: () => {
    console.log('[Mock PConnect] getComponentConfig');
    return {
      value: 'testValue',
      label: 'Test Label',
    };
  },
  getChildren: () => {
    console.log('[Mock PConnect] getChildren');
    return [];
  },
  getStateProps: () => {
    console.log('[Mock PConnect] getStateProps');
    return {};
  },
  getActionsApi: () => {
    console.log('[Mock PConnect] getActionsApi');
    return {
      updateFieldValue: (propName, value) => {
        console.log('[Mock Actions] updateFieldValue:', propName, value);
      },
      triggerFieldChange: (propName, value) => {
        console.log('[Mock Actions] triggerFieldChange:', propName, value);
      },
      openWorkByHandle: (handle) => {
        console.log('[Mock Actions] openWorkByHandle:', handle);
      },
      openAssignment: (assignmentID) => {
        console.log('[Mock Actions] openAssignment:', assignmentID);
      },
    };
  },
  getValidationApi: () => {
    console.log('[Mock PConnect] getValidationApi');
    return {
      validate: () => ({ valid: true, errors: [] }),
    };
  },
  resolveConfigProps: (props) => {
    console.log('[Mock PConnect] resolveConfigProps:', props);
    return props;
  },
  getComponentName: () => {
    console.log('[Mock PConnect] getComponentName');
    return 'MockComponent';
  },
  getCaseInfo: () => {
    console.log('[Mock PConnect] getCaseInfo');
    return {
      caseID: 'C-1234',
      caseTypeID: 'Work-MyCase',
      businessID: 'CASE-001',
      status: 'Open',
    };
  },
  getDataObject: (dataRef) => {
    console.log('[Mock PConnect] getDataObject:', dataRef);
    return {};
  },
  createComponent: (config) => {
    console.log('[Mock PConnect] createComponent:', config);
    return null;
  },
  getContextName: () => {
    console.log('[Mock PConnect] getContextName');
    return 'app/primary';
  },
  getTarget: () => {
    console.log('[Mock PConnect] getTarget');
    return '';
  },
  getPageReference: () => {
    console.log('[Mock PConnect] getPageReference');
    return 'pyWorkPage';
  },
};

export function getPConnect() {
  return () => mockPConnect;
}

export default mockPConnect;
`;

/**
 * Mock @pega/cosmos-react-core components
 * Provides simplified HTML-based implementations of Cosmos components
 */
const MOCK_COSMOS_CORE_MODULE = `
import React from 'react';

// Mock Cosmos components with basic HTML elements
export const Button = ({ children, onClick, disabled, variant, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '8px 16px',
      borderRadius: '4px',
      border: variant === 'primary' ? 'none' : '1px solid #ccc',
      backgroundColor: variant === 'primary' ? '#004080' : 'white',
      color: variant === 'primary' ? 'white' : '#212121',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}
    {...props}
  >
    {children}
  </button>
);

export const Card = ({ children, ...props }) => (
  <div
    style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: 'white',
    }}
    {...props}
  >
    {children}
  </div>
);

export const Input = ({ value, onChange, placeholder, disabled, ...props }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    style={{
      padding: '8px 12px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '14px',
      width: '100%',
    }}
    {...props}
  />
);

export const Text = ({ children, variant, ...props }) => {
  const Tag = variant === 'h1' ? 'h1' : variant === 'h2' ? 'h2' : 'span';
  return <Tag {...props}>{children}</Tag>;
};

export const Icon = ({ icon, ...props }) => (
  <span style={{ marginRight: '4px' }} {...props}>
    ⚫
  </span>
);

export const FieldValueList = ({ children, variant, ...props }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: variant === 'stacked' ? 'column' : 'row',
      gap: '8px',
    }}
    {...props}
  >
    {children}
  </div>
);

export const Flex = ({ children, direction, gap, ...props }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: direction || 'row',
      gap: gap || '8px',
    }}
    {...props}
  >
    {children}
  </div>
);

export const registerIcon = () => {
  console.log('[Mock Cosmos] registerIcon called');
};
`;

/**
 * Mock styled-components
 * Provides a minimal styled() proxy that renders plain elements
 */
const MOCK_STYLED_COMPONENTS_MODULE = `
import React from 'react';

// Mock styled-components that just renders plain elements
const styled = new Proxy(
  {},
  {
    get: (target, prop) => {
      return (styles) => {
        return React.forwardRef((props, ref) => {
          const Element = prop;
          // Convert styled styles to inline styles (simplified)
          let inlineStyles = {};
          if (typeof styles === 'function') {
            // Call the styles function with mock theme
            const mockTheme = {
              base: {
                spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
                palette: {
                  primary: '#004080',
                  'primary-foreground': '#ffffff',
                  text: '#212121',
                  error: '#E53935',
                },
                colors: {
                  border: '#e0e0e0',
                },
              },
            };
            try {
              const result = styles({ theme: mockTheme });
              // Very basic CSS-in-JS parsing
              if (typeof result === 'string') {
                // Extract simple properties (not a full parser)
                const paddingMatch = result.match(/padding:\\s*([^;]+)/);
                const colorMatch = result.match(/color:\\s*([^;]+)/);
                const borderMatch = result.match(/border:\\s*([^;]+)/);
                if (paddingMatch) inlineStyles.padding = paddingMatch[1].trim();
                if (colorMatch) inlineStyles.color = colorMatch[1].trim();
                if (borderMatch) inlineStyles.border = borderMatch[1].trim();
              }
            } catch (e) {
              console.log('[Mock styled-components] Error parsing styles:', e);
            }
          }
          return React.createElement(Element, { ...props, style: { ...inlineStyles, ...props.style }, ref });
        });
      };
    },
  }
);

export default styled;

export const css = (strings, ...values) => {
  return strings.reduce((acc, str, i) => {
    return acc + str + (values[i] || '');
  }, '');
};

export const ThemeProvider = ({ children, theme }) => children;
`;

/**
 * Returns all mock modules as Sandpack virtual files
 * These files are placed under /node_modules/ in the Sandpack file system
 */
export function getSandpackMockFiles(): Record<string, { code: string; hidden?: boolean }> {
  return {
    "/node_modules/@pega/pcore-pconnect-typedefs/index.js": {
      code: MOCK_PCONNECT_MODULE,
      hidden: true,
    },
    "/node_modules/@pega/cosmos-react-core/index.js": {
      code: MOCK_COSMOS_CORE_MODULE,
      hidden: true,
    },
    "/node_modules/styled-components/index.js": {
      code: MOCK_STYLED_COMPONENTS_MODULE,
      hidden: true,
    },
  };
}
