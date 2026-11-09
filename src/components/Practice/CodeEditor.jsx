import React, { useRef } from 'react';

// A dependency-free code editor: a textarea with a synced line-number
// gutter and sane Tab-key behavior. Not Monaco, but zero extra bundle
// weight and no external CDN dependency — swap for CodeMirror/Monaco
// later without touching anything else in this module.
function CodeEditor({ value, onChange }) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);

  const lineCount = value.split('\n').length;

  function handleScroll() {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = value.slice(0, start) + '  ' + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
  }

  return (
    <div className="code-editor">
      <div className="code-editor-gutter" ref={gutterRef} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className="code-editor-line-number">{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className="code-editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
      />
    </div>
  );
}

export default CodeEditor;
