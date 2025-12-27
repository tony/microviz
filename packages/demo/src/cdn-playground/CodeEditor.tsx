import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import {
  bracketMatching,
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { useEffect, useLayoutEffect, useRef } from "react";

export type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language?: "html" | "javascript";
  theme?: "light" | "dark";
  className?: string;
};

/**
 * CodeMirror 6 editor wrapper for React.
 * No native React wrapper exists, so we manage EditorView lifecycle manually.
 */
export function CodeEditor({
  value,
  onChange,
  language = "html",
  theme = "dark",
  className = "",
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const isInternalChange = useRef(false);

  // Keep onChange ref updated
  onChangeRef.current = onChange;

  // Create editor on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: value is intentionally excluded - we sync it via the second useEffect to avoid destroying the editor on every keystroke
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      bracketMatching(),
      closeBrackets(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap]),
      language === "html" ? html() : javascript(),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          isInternalChange.current = true;
          onChangeRef.current(update.state.doc.toString());
        }
      }),
      EditorView.theme({
        ".cm-content": {
          padding: "8px 0",
        },
        ".cm-gutters": {
          borderRight: "none",
        },
        ".cm-scroller": {
          fontFamily:
            "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
          overflow: "auto",
        },
        "&": {
          fontSize: "13px",
          height: "100%",
        },
      }),
    ];

    if (theme === "dark") {
      extensions.push(oneDark);
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      parent: containerRef.current,
      state,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [language, theme]); // Recreate on language/theme change

  // Sync value from props (external changes)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    // Skip if this is an internal change (from typing)
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: { from: 0, insert: value, to: currentDoc.length },
      });
    }
  }, [value]);

  return (
    <div className={`h-full overflow-hidden ${className}`} ref={containerRef} />
  );
}
