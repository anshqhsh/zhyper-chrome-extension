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

interface MetaData {
  title: string;
  description?: string;
  image?: string;
}

interface QuickLink {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  metaData?: MetaData;
}

interface BookmarkGroup {
  id: string;
  name: string;
  color: string;
  size: number;
  links: QuickLink[];
}

const DEFAULT_COLORS = [
  'bg-emerald-100 dark:bg-emerald-900/30',
  'bg-blue-100 dark:bg-blue-900/30',
  'bg-purple-100 dark:bg-purple-900/30',
  'bg-orange-100 dark:bg-orange-900/30',
  'bg-pink-100 dark:bg-pink-900/30',
  'bg-cyan-100 dark:bg-cyan-900/30',
];

const MIN_GROUP_SIZE = 3;
const MAX_GROUP_SIZE = 12;

interface TreemapItem {
  id: string;
  name: string;
  size: number;
  color: string;
  links: QuickLink[];
  width: number;
  height: number;
  x: number;
  y: number;
}

const App = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarkGroups, setBookmarkGroups] = useState<BookmarkGroup[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [draggedBookmark, setDraggedBookmark] = useState<QuickLink | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');

  const calculateTreemap = (groups: BookmarkGroup[], width: number, height: number): TreemapItem[] => {
    const totalSize = groups.reduce((sum, group) => sum + Math.max(1, group.links.length), 0);
    const items: TreemapItem[] = groups.map(group => ({
      ...group,
      size: Math.max(1, group.links.length),
      width: 0,
      height: 0,
      x: 0,
      y: 0,
    }));

    const layoutTreemap = (items: TreemapItem[], x: number, y: number, width: number, height: number) => {
      if (items.length === 0) return;

      const totalSize = items.reduce((sum, item) => sum + item.size, 0);
      let currentX = x;
      let currentY = y;
      let remainingWidth = width;
      let remainingHeight = height;

      items.forEach(item => {
        const ratio = item.size / totalSize;
        if (width > height) {
          item.width = Math.floor(ratio * width);
          item.height = height;
          item.x = currentX;
          item.y = currentY;
          currentX += item.width;
          remainingWidth -= item.width;
        } else {
          item.width = width;
          item.height = Math.floor(ratio * height);
          item.x = currentX;
          item.y = currentY;
          currentY += item.height;
          remainingHeight -= item.height;
        }
      });
    };

    layoutTreemap(items, 0, 0, width, height);
    return items;
  };

  const [treemapItems, setTreemapItems] = useState<TreemapItem[]>([]);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    // 북마크 트리 가져오기
    chrome.bookmarks.getTree(bookmarkTreeNodes => {
      const bookmarks = bookmarkTreeNodes[0].children || [];
      setBookmarks(bookmarks);
    });

    // 저장된 북마크 그룹 불러오기
    chrome.storage.local.get(['bookmarkGroups', 'showPreview'], result => {
      if (result.bookmarkGroups) {
        setBookmarkGroups(result.bookmarkGroups);
      }
      if (typeof result.showPreview !== 'undefined') {
        setShowPreview(result.showPreview);
      }
    });

    if (containerRef && bookmarkGroups.length > 0) {
      const { width, height } = containerRef.getBoundingClientRect();
      const items = calculateTreemap(bookmarkGroups, width, height);
      setTreemapItems(items);
    }
  }, [bookmarkGroups, containerRef]);

  const saveBookmarkGroups = (groups: BookmarkGroup[]) => {
    setBookmarkGroups(groups);
    chrome.storage.local.set({ bookmarkGroups: groups });
  };

  const calculateGroupSize = (linksCount: number) => {
    // 링크 개수에 따라 그룹 크기를 동적으로 계산
    const baseSize = Math.ceil(Math.sqrt(linksCount + 1)) * 2;
    return Math.min(Math.max(baseSize, MIN_GROUP_SIZE), MAX_GROUP_SIZE);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup: BookmarkGroup = {
      id: Date.now().toString(),
      name: newGroupName,
      color: DEFAULT_COLORS[bookmarkGroups.length % DEFAULT_COLORS.length],
      size: MIN_GROUP_SIZE,
      links: [],
    };

    saveBookmarkGroups([...bookmarkGroups, newGroup]);
    setNewGroupName('');
  };

  const handleGroupSizeChange = (groupId: string, newSize: number) => {
    const updatedGroups = bookmarkGroups.map(group => (group.id === groupId ? { ...group, size: newSize } : group));
    saveBookmarkGroups(updatedGroups);
  };

  const handleDrop = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    if (draggedBookmark) {
      const updatedGroups = bookmarkGroups.map(group => {
        if (group.id === groupId) {
          const updatedLinks = [...group.links, draggedBookmark];
          return {
            ...group,
            links: updatedLinks,
            size: isEditMode ? group.size : calculateGroupSize(updatedLinks.length),
          };
        }
        return group;
      });
      saveBookmarkGroups(updatedGroups);
    }
    setIsDragging(false);
  };

  const handleRemoveLink = (groupId: string, linkId: string) => {
    const updatedGroups = bookmarkGroups.map(group => {
      if (group.id === groupId) {
        const updatedLinks = group.links.filter(link => link.id !== linkId);
        return {
          ...group,
          links: updatedLinks,
          size: isEditMode ? group.size : calculateGroupSize(updatedLinks.length),
        };
      }
      return group;
    });
    saveBookmarkGroups(updatedGroups);
  };

  const handleRemoveGroup = (groupId: string) => {
    const updatedGroups = bookmarkGroups.filter(group => group.id !== groupId);
    saveBookmarkGroups(updatedGroups);
  };

  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {
      return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236B7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>';
    }
  };

  const fetchMetaData = async (url: string): Promise<MetaData> => {
    try {
      const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      return {
        title: data.data.title || '',
        description: data.data.description || '',
        image: data.data.image?.url,
      };
    } catch (error) {
      console.error('Error fetching meta data:', error);
      return { title: '' };
    }
  };

  const handleDragStart = async (bookmark: Bookmark) => {
    if (bookmark.url) {
      setIsDragging(true);
      const metaData = await fetchMetaData(bookmark.url);
      setDraggedBookmark({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        favicon: getFaviconUrl(bookmark.url),
        metaData,
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTogglePreview = () => {
    const newValue = !showPreview;
    setShowPreview(newValue);
    chrome.storage.local.set({ showPreview: newValue });
  };

  const renderBookmark = (bookmark: Bookmark) => {
    if (bookmark.url) {
      return (
        <div
          key={bookmark.id}
          draggable
          onDragStart={() => handleDragStart(bookmark)}
          className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-move">
          <img
            src={getFaviconUrl(bookmark.url)}
            alt=""
            className="w-4 h-4 mr-2"
            onError={e => {
              const target = e.target as HTMLImageElement;
              target.src =
                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236B7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>';
            }}
          />
          <span className="truncate">{bookmark.title}</span>
        </div>
      );
    }

    return (
      <div key={bookmark.id} className="mb-4">
        <div className="font-semibold p-2">{bookmark.title}</div>
        {bookmark.children && <div className="ml-4">{bookmark.children.map(renderBookmark)}</div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">새 탭</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm">미리보기</span>
              <input
                type="checkbox"
                checked={showPreview}
                onChange={handleTogglePreview}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">편집</span>
              <input
                type="checkbox"
                checked={isEditMode}
                onChange={e => setIsEditMode(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <Button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? '북마크 닫기' : '북마크 열기'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`${isSidebarOpen ? 'md:col-span-3' : 'md:col-span-4'}`}>
            <div className="mb-4 flex items-center space-x-2">
              <input
                type="text"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="새 그룹 이름"
                className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
              />
              <Button onClick={handleCreateGroup}>그룹 추가</Button>
            </div>

            <div
              ref={setContainerRef}
              className="relative w-full h-[calc(100vh-200px)] bg-gray-100 dark:bg-gray-800 rounded-lg">
              {treemapItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    position: 'absolute',
                    left: item.x,
                    top: item.y,
                    width: item.width,
                    height: item.height,
                  }}
                  className={`${item.color} rounded-lg p-4 overflow-auto transition-all duration-300 ease-in-out`}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDrop(e, item.id)}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{item.name}</h3>
                    {isEditMode && (
                      <button onClick={() => handleRemoveGroup(item.id)} className="text-red-500 hover:text-red-700">
                        ×
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {item.links.map(link => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-2">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <img
                            src={link.favicon || getFaviconUrl(link.url)}
                            alt=""
                            className="w-4 h-4 flex-shrink-0"
                            onError={e => {
                              const target = e.target as HTMLImageElement;
                              target.src =
                                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236B7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>';
                            }}
                          />
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                            {link.title}
                          </a>
                        </div>
                        <button
                          onClick={() => handleRemoveLink(item.id, link.id)}
                          className="text-gray-500 hover:text-red-500 ml-2 flex-shrink-0">
                          ×
                        </button>
                      </div>
                    ))}
                    {isDragging && (
                      <div className="border-2 border-dashed border-blue-500 dark:border-blue-400 rounded p-4 text-center">
                        <div className="text-blue-500 dark:text-blue-400">+</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isSidebarOpen && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">북마크</h2>
              <div className="overflow-y-auto max-h-[calc(100vh-200px)]">{bookmarks.map(renderBookmark)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(App, <div>{t('loading')}</div>), <div> Error Occur </div>);
