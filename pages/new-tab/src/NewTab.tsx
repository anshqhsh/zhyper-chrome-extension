import '@src/NewTab.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { Button } from '@extension/ui/components/button';
import { t } from '@extension/i18n';

const NewTab = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'new-tab/logo_horizontal.svg' : 'new-tab/logo_horizontal_dark.svg';
  const goGithubSite = () =>
    chrome.tabs.create({ url: 'https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite' });

  console.log(t('hello', 'World'));
  return (
    <div className={`min-h-screen ${isLight ? 'bg-background' : 'dark bg-background'}`}>
      <div className="container mx-auto py-8">
        <header className="flex flex-col items-center space-y-4">
          <button onClick={goGithubSite} className="hover:opacity-80 transition-opacity">
            <img src={chrome.runtime.getURL(logo)} className="h-32" alt="logo" />
          </button>
          <p className="text-foreground">
            Edit <code className="bg-muted px-2 py-1 rounded">pages/new-tab/src/NewTab.tsx</code>
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button onClick={exampleThemeStorage.toggle} variant="outline">
              {t('toggleTheme')}
            </Button>
            <Button variant="default" onClick={goGithubSite}>
              Visit GitHub
            </Button>
          </div>
        </header>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(NewTab, <div>{t('loading')}</div>), <div> Error Occur </div>);
