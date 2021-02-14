import { createGlobalStyle } from 'styled-components';
import colours from '../consts/colours';
 
const GlobalStyle = createGlobalStyle`
  body {
    color: ${colours.text};
    margin: 0;
    padding: 0;
    background: ${colours.background};
    font-family: Open-Sans, Helvetica, Sans-Serif;
  }

`;
 
export default GlobalStyle;