import { createGlobalStyle } from 'styled-components'
import tw, { GlobalStyles as BaseStyles } from 'twin.macro'

const CustomStyles = createGlobalStyle`
  :root {
    --color-text: 23 19 18;
    --color-text-muted: 114 88 70;
    --color-text-subtle: 156 122 99;
    --color-text-inverse: 255 248 241;
    --color-surface: 255 255 255;
    --color-surface-raised: 255 253 251;
    --color-surface-muted: 250 247 243;
    --color-surface-subtle: 240 229 219;
    --color-surface-inverse: 23 19 18;
    --color-border: 231 220 210;
    --color-border-muted: 238 230 222;
    --color-border-strong: 215 201 189;
    --color-accent: 139 74 43;
    --color-accent-hover: 111 58 34;
    --color-accent-soft: 244 177 126;
    --color-accent-muted: 255 248 241;
    --color-accent-border: 201 183 168;
    --color-danger: 220 38 38;
    --color-danger-surface: 254 242 242;
    --color-danger-border: 254 202 202;
    --color-success: 22 116 67;
    --color-success-surface: 236 253 243;
    --color-success-border: 188 231 206;
    --shadow-card: 0 1px 2px rgba(24,24,27,0.03);
    --shadow-card-hover: 0 16px 32px -24px rgba(24,24,27,0.38);
    --sticky-nav-height: 42px;
    --sticky-filter-top: calc(var(--sticky-nav-height) + 8px);
    --page-background:
      radial-gradient(circle at 12% 0%, rgba(190, 118, 72, 0.12), transparent 28rem),
      linear-gradient(180deg, #F7F3EE 0%, #F8F7F4 42%, #F2F5F2 100%);
  }

  :root[data-theme='dark'] {
    --color-text: 246 239 232;
    --color-text-muted: 205 185 171;
    --color-text-subtle: 163 138 122;
    --color-text-inverse: 255 248 241;
    --color-surface: 31 27 25;
    --color-surface-raised: 39 33 30;
    --color-surface-muted: 46 39 35;
    --color-surface-subtle: 58 47 40;
    --color-surface-inverse: 18 15 14;
    --color-border: 70 58 50;
    --color-border-muted: 58 48 42;
    --color-border-strong: 96 77 65;
    --color-accent: 222 139 87;
    --color-accent-hover: 244 177 126;
    --color-accent-soft: 255 201 154;
    --color-accent-muted: 58 43 34;
    --color-accent-border: 137 97 73;
    --color-danger: 248 113 113;
    --color-danger-surface: 69 26 30;
    --color-danger-border: 127 41 49;
    --color-success: 74 222 128;
    --color-success-surface: 22 52 38;
    --color-success-border: 45 99 69;
    --shadow-card: 0 1px 2px rgba(0,0,0,0.24);
    --shadow-card-hover: 0 20px 42px -28px rgba(0,0,0,0.72);
    --page-background:
      radial-gradient(circle at 10% -4%, rgba(222, 139, 87, 0.16), transparent 30rem),
      linear-gradient(180deg, #171312 0%, #1F1B19 44%, #151918 100%);
  }

  body {
    ${tw`antialiased`}
    color: rgb(var(--color-text));
    background: var(--page-background);
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    letter-spacing: 0;
  }
  html {
    background: rgb(var(--color-surface-muted));
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  a { color: inherit; text-decoration: none; }
  button { cursor: pointer; border: none; background: none; font: inherit; }
  svg[aria-hidden="true"] {
    display: block;
    flex-shrink: 0;
    overflow: visible;
    vertical-align: middle;
  }
  button svg[aria-hidden="true"],
  a svg[aria-hidden="true"] {
    pointer-events: none;
  }
  ::selection { background: rgb(var(--color-accent)); color: rgb(var(--color-text-inverse)); }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgb(var(--color-border-strong)); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgb(var(--color-text-subtle)); }
`

export const GlobalStyles = () => (
  <>
    <BaseStyles />
    <CustomStyles />
  </>
)
