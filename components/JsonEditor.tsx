import React, { useState, useCallback } from 'react';
import { Icons } from './Icon';

interface JsonEditorProps {
  value: string;
  onSave: (json: string) => void;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ value, onSave }) => {
  const [text, setText] = useState(value);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(() => {
    try {
      const parsed = JSON.parse(text); // Validation check
      onSave(JSON.stringify(parsed, null, 2)); // Formatting
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [text, onSave]);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden shadow-lg">
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2 text-slate-200">
           <Icons.Code className="w-5 h-5 text-indigo-400" />
           <h2 className="font-semibold">Project JSON State</h2>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium transition-colors"
        >
          <Icons.Save className="w-4 h-4" />
          Load Context
        </button>
      </div>
      
      <div className="flex-1 relative">
        <textarea
          className="w-full h-full bg-slate-950 p-4 text-slate-300 font-mono text-sm focus:outline-none resize-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your project JSON here to restore context..."
        />
        {error && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-900/90 text-red-100 p-3 rounded border border-red-700 flex items-start gap-3 backdrop-blur-sm">
                <Icons.AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-mono">{error}</span>
            </div>
        )}
      </div>
    </div>
  );
};