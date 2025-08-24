import React from 'react';
import styled from 'styled-components';

interface ComicButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const ComicButton: React.FC<ComicButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className = '',
  type = 'button'
}) => {
  return (
    <StyledWrapper className={className}>
      <button 
        className={`comic-button ${disabled ? 'disabled' : ''}`}
        onClick={onClick}
        disabled={disabled}
        type={type}
      >
        {children}
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .comic-button {
    display: inline-block;
    padding: 10px 20px;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    text-decoration: none;
    color: #fff;
    background-color: #3b82f6; /* Using primary-blue color */
    border: 2px solid #000;
    border-radius: 10px;
    box-shadow: 5px 5px 0px #000;
    transition: all 0.3s ease;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    width: 100%;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .comic-button:hover:not(.disabled) {
    background-color: #fff;
    color: #3b82f6;
    border: 2px solid #3b82f6;
    box-shadow: 5px 5px 0px #3b82f6;
  }

  .comic-button:active:not(.disabled) {
    background-color: #10b981; /* Using primary-green for active state */
    color: #fff;
    box-shadow: none;
    transform: translateY(4px);
  }

  .comic-button.disabled {
    background-color: #6b7280;
    color: #9ca3af;
    border: 2px solid #374151;
    box-shadow: 5px 5px 0px #374151;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export default ComicButton;
