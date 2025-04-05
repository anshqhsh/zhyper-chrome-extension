import { useEffect, useState } from 'react';

export default function App() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    console.log('runtime content view loaded');
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg bg-white shadow-lg dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Chrome Extension</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-300">현재 페이지 URL: {window.location.href}</div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => console.log('Action 1 clicked')}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Action 1
          </button>

          <button
            onClick={() => console.log('Action 2 clicked')}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600">
            Action 2
          </button>
        </div>
      </div>
    </div>
  );
}
