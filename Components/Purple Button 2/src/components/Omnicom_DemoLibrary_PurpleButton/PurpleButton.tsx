import React, { useState } from 'react';
import { StyledWrapper, StyledLabel, StyledInput, StyledError } from './PurpleButton.styles';

export interface PurpleButtonProps {
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

const PurpleButton: React.FC<PurpleButtonProps> = (props) => {
  const {
    getPConnect,
    label = '',
    value: initialValue = '',
    placeholder = '',
    required = false,
    disabled = false,
    readOnly = false,
    helperText = '',
    testId = 'PurpleButton',
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

export default PurpleButton;
