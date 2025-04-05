import { createRoot } from 'react-dom/client';
import App from '@src/App';
import injectedStyle from '@src/index.css?inline';
import sharedStyle from '@extension/ui/src/styles/globals.css?inline';

export function mount() {
  const root = document.createElement('div');
  root.id = 'chrome-extension-boilerplate-react-vite-runtime-content-view-root';

  document.body.append(root);

  const rootIntoShadow = document.createElement('div');
  rootIntoShadow.id = 'shadow-root';

  const shadowRoot = root.attachShadow({ mode: 'open' });

  // 모든 스타일을 하나의 문자열로 결합
  const combinedStyles = `${sharedStyle}\n${injectedStyle}`;

  if (navigator.userAgent.includes('Firefox')) {
    /**
     * In the firefox environment, adoptedStyleSheets cannot be used due to the bug
     * @url https://bugzilla.mozilla.org/show_bug.cgi?id=1770592
     *
     * Injecting styles into the document, this may cause style conflicts with the host page
     */
    const styleElement = document.createElement('style');
    styleElement.innerHTML = combinedStyles;
    shadowRoot.appendChild(styleElement);
  } else {
    /** Inject styles into shadow dom */
    const globalStyleSheet = new CSSStyleSheet();
    globalStyleSheet.replaceSync(combinedStyles);
    shadowRoot.adoptedStyleSheets = [globalStyleSheet];
  }

  shadowRoot.appendChild(rootIntoShadow);
  createRoot(rootIntoShadow).render(<App />);
}
