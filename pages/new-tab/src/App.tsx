import { useEffect, useState } from 'react';
import { Button } from '@extension/ui/components/button';

import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { t } from '@extension/i18n';

interface Bookmark {
  id: string;
  title: string;
  url?: string;
  children?: Bookmark[];
}

const App = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');

  useEffect(() => {
    // 북마크 트리 가져오기
    chrome.bookmarks.getTree(bookmarkTreeNodes => {
      const bookmarks = bookmarkTreeNodes[0].children || [];
      setBookmarks(bookmarks);

      // 기본적으로 첫 번째 북마크 폴더 선택
      if (bookmarks.length > 0 && bookmarks[0].children) {
        setSelectedFolder(bookmarks[0].id);
      }
    });
  }, []);

  const renderBookmark = (bookmark: Bookmark) => {
    if (bookmark.url) {
      return (
        <a
          key={bookmark.id}
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
          <span className="truncate">{bookmark.title}</span>
        </a>
      );
    }

    return (
      <div key={bookmark.id} className="mb-4">
        <Button variant="ghost" className="w-full justify-start" onClick={() => setSelectedFolder(bookmark.id)}>
          {bookmark.title}
        </Button>
        {selectedFolder === bookmark.id && bookmark.children && (
          <div className="ml-4 mt-2">{bookmark.children.map(renderBookmark)}</div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">북마크</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">북마크 폴더</h2>
          {bookmarks.map(renderBookmark)}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">선택된 폴더</h2>
          {selectedFolder && bookmarks.find(b => b.id === selectedFolder)?.children?.map(renderBookmark)}
        </div>
      </div>
    </div>
  );
};
export default withErrorBoundary(withSuspense(App, <div>{t('loading')}</div>), <div> Error Occur </div>);
