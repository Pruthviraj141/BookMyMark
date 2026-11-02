import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss() as any]
  }),
  manifest: ({ browser }) => {
    const isFirefox = browser === 'firefox';
    return {
      name: 'BookMyMark — Smart Bookmark Manager',
      description: 'Save links, articles, videos and social posts instantly to BookMyMark with one click or shortcut.',
      version: '1.0.0',
      permissions: [
        'contextMenus',
        'activeTab',
        'storage',
        'identity',
        'tabs',
        'webRequest',
        'webNavigation',
        ...(isFirefox ? [
          'webRequestBlocking',
          '*://ycaenlslaoiqnyopmytx.supabase.co/*',
          '*://accounts.google.com/*'
        ] : [])
      ],
      ...(!isFirefox ? {
        host_permissions: [
          '*://ycaenlslaoiqnyopmytx.supabase.co/*',
          '*://accounts.google.com/*'
        ]
      } : {}),
      action: {
        default_title: 'BookMyMark',
        default_icon: {
          '16': 'icons/icon-16.png',
          '32': 'icons/icon-32.png',
          '48': 'icons/icon-48.png',
          '128': 'icons/icon-128.png'
        }
      },
      icons: {
        '16': 'icons/icon-16.png',
        '32': 'icons/icon-32.png',
        '48': 'icons/icon-48.png',
        '128': 'icons/icon-128.png'
      },
      commands: {
        'save-current-page': {
          suggested_key: {
            default: 'Alt+Shift+B',
            mac: 'Alt+Shift+B'
          },
          description: 'Save current page to BookMyMark'
        }
      },
      ...(isFirefox ? {
        browser_specific_settings: {
          gecko: {
            id: 'extension@bookmymark.app',
            strict_min_version: '109.0'
          }
        }
      } : {})
    };
  }
});
