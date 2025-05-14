// components/game/DataDebug.jsx
'use client';

export default function DataDebug({ industries, cards }) {
  return (
    <div className="bg-slate-800 p-4 m-4 rounded-lg text-xs">
      <h3 className="font-bold mb-2">Debug Data</h3>
      <div>
        <p>Industries loaded: {industries.length}</p>
        <p>Cards loaded: {Object.keys(cards).length} industries with cards</p>
        <details>
          <summary className="cursor-pointer text-blue-400">View loaded data</summary>
          <pre className="mt-2 p-2 bg-slate-900 rounded overflow-auto max-h-40">
            {JSON.stringify({ industries, cards }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}