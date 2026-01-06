import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  :root {
    --bg-color: ${props => props.theme.colors.bg};
    --sidebar-bg: ${props => props.theme.colors.sidebarBg};
    --text-primary: ${props => props.theme.colors.textPrimary};
    --text-secondary: ${props => props.theme.colors.textSecondary};
    --accent-color: ${props => props.theme.colors.accent};
    --hover-bg: ${props => props.theme.colors.hoverBg};
    --input-bg: ${props => props.theme.colors.inputBg};
    --border-color: ${props => props.theme.colors.borderColor};
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: var(--bg-color);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    height: 100vh;
    overflow: hidden;
    transition: background-color 0.3s, color 0.3s;
  }

  #root {
    height: 100%;
    display: flex;
  }

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.borderColor};
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.textSecondary};
  }
`;
