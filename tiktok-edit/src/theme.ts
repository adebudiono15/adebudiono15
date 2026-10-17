import { staticFile } from "remotion";

export const YELLOW = "#FFE34D";
export const GRADE = "contrast(1.05) saturate(1.08) brightness(1.02)";
export const FONT = "'Montserrat', sans-serif";
export const fontFaces = `
@font-face { font-family: 'Montserrat'; font-weight: 800; src: url(${staticFile("fonts/montserrat-latin-800-normal.woff2")}) format('woff2'); }
@font-face { font-family: 'Montserrat'; font-weight: 900; src: url(${staticFile("fonts/montserrat-latin-900-normal.woff2")}) format('woff2'); }
`;
