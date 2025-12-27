import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type { CspMode } from "./cdnPlaygroundState";

export type ConsoleEntry = {
  type: "log" | "warn" | "error" | "info";
  args: string[];
  timestamp: number;
};

export type PreviewPaneProps = {
  code: string;
  cdnUrl: string;
  cspMode: CspMode;
  onConsoleMessage?: (entry: ConsoleEntry) => void;
  className?: string;
};

export type PreviewPaneHandle = {
  /** Update an attribute on elements matching the selector without full reload */
  updateAttribute: (selector: string, attribute: string, value: string) => void;
};

/**
 * Generate the console capture script to inject into the iframe.
 */
function getConsoleCaptureScript(): string {
  return `
<script>
(function() {
  const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
  };

  ['log', 'warn', 'error', 'info'].forEach(method => {
    console[method] = (...args) => {
      originalConsole[method](...args);
      try {
        parent.postMessage({
          type: 'console',
          method,
          args: args.map(arg => {
            try {
              if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
              }
              return String(arg);
            } catch {
              return String(arg);
            }
          }),
          timestamp: Date.now(),
        }, '*');
      } catch (e) {
        originalConsole.error('Console capture error:', e);
      }
    };
  });

  window.onerror = (message, source, lineno, colno, error) => {
    parent.postMessage({
      type: 'console',
      method: 'error',
      args: [\`Error: \${message} (line \${lineno})\`],
      timestamp: Date.now(),
    }, '*');
    return false;
  };

  window.onunhandledrejection = (event) => {
    parent.postMessage({
      type: 'console',
      method: 'error',
      args: [\`Unhandled Promise: \${event.reason}\`],
      timestamp: Date.now(),
    }, '*');
  };

  // Listen for microviz-warning events and forward to console
  document.addEventListener('microviz-warning', (event) => {
    const detail = event.detail;
    if (!detail || !detail.warnings) return;
    for (const warning of detail.warnings) {
      parent.postMessage({
        type: 'console',
        method: 'warn',
        args: [\`⚠ [\${warning.code}] \${warning.message}\${warning.hint ? ' — ' + warning.hint : ''}\`],
        timestamp: Date.now(),
      }, '*');
    }
  });

  // Listen for reactive attribute updates from parent
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'microviz:updateAttribute') {
      const { selector, attribute, value } = e.data;
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.setAttribute(attribute, value));
    }
  });
})();
</script>`;
}

/**
 * Generate CSP meta tag based on mode.
 */
function getCspMetaTag(cspMode: CspMode): string {
  switch (cspMode) {
    case "claude-artifacts":
      // Claude Artifacts only allows cdnjs.cloudflare.com
      return `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline';">`;
    default:
      return "";
  }
}

/**
 * Generate the full srcdoc HTML with CDN URL replaced and scripts injected.
 */
function generateSrcdoc(
  code: string,
  cdnUrl: string,
  cspMode: CspMode,
): string {
  // Replace {{CDN_URL}} placeholder with actual CDN URL
  let processedCode = code.replace(/\{\{CDN_URL\}\}/g, cdnUrl);

  // Inject console capture script after <head> or at the start of <body>
  const consoleCaptureScript = getConsoleCaptureScript();
  const cspMeta = getCspMetaTag(cspMode);

  // Find insertion point - after <head> tag or before first script
  if (processedCode.includes("<head>")) {
    processedCode = processedCode.replace(
      "<head>",
      `<head>\n${cspMeta}\n${consoleCaptureScript}`,
    );
  } else if (processedCode.includes("<body>")) {
    processedCode = processedCode.replace(
      "<body>",
      `<body>\n${consoleCaptureScript}`,
    );
  } else {
    // Fallback: prepend
    processedCode = `${cspMeta}\n${consoleCaptureScript}\n${processedCode}`;
  }

  return processedCode;
}

/**
 * Sandboxed iframe preview for the CDN playground.
 */
export const PreviewPane = forwardRef<PreviewPaneHandle, PreviewPaneProps>(
  function PreviewPane(
    { code, cdnUrl, cspMode, onConsoleMessage, className = "" },
    ref,
  ) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Expose updateAttribute method to parent via ref
    const updateAttribute = useCallback(
      (selector: string, attribute: string, value: string) => {
        iframeRef.current?.contentWindow?.postMessage(
          {
            attribute,
            selector,
            type: "microviz:updateAttribute",
            value,
          },
          "*",
        );
      },
      [],
    );

    useImperativeHandle(ref, () => ({ updateAttribute }), [updateAttribute]);

    // Generate srcdoc from inputs (useMemo ensures it's ready on first render)
    const srcdoc = useMemo(
      () => generateSrcdoc(code, cdnUrl, cspMode),
      [code, cdnUrl, cspMode],
    );

    // Listen for postMessage from iframe
    const handleMessage = useCallback(
      (event: MessageEvent) => {
        // Only accept messages from our iframe
        if (event.source !== iframeRef.current?.contentWindow) {
          return;
        }

        const data = event.data;
        if (data?.type === "console" && onConsoleMessage) {
          onConsoleMessage({
            args: data.args,
            timestamp: data.timestamp,
            type: data.method,
          });
        }
      },
      [onConsoleMessage],
    );

    useEffect(() => {
      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }, [handleMessage]);

    return (
      <div className={`relative h-full bg-white ${className}`}>
        <iframe
          className="h-full w-full border-0"
          ref={iframeRef}
          sandbox="allow-scripts"
          srcDoc={srcdoc}
          title="Preview"
        />
      </div>
    );
  },
);
