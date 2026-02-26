import styled from 'styled-components';

export const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme?.base?.spacing?.sm || '8px'};
  font-family: 'Open Sans', sans-serif;
`;

export const StyledLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme?.base?.palette?.text || '#212121'};
`;

export const StyledInput = styled.input`
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme?.base?.palette?.primary || '#004080'};
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

export const StyledError = styled.div`
  color: ${({ theme }) => theme?.base?.palette?.error || '#E53935'};
  font-size: 12px;
  margin-top: 4px;
`;
