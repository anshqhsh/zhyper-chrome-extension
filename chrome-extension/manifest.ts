import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

/**
 * Chrome 확장 프로그램의 매니페스트 설정
 *
 * @prop manifest_version - Chrome 확장 프로그램의 매니페스트 버전 (현재는 3)
 * @prop default_locale - 기본 언어 설정 (다국어 지원 시 사용)
 * @prop name - 확장 프로그램 이름 (__MSG_extensionName__는 다국어 지원을 위한 키)
 * @prop version - 패키지 버전을 사용하여 확장 프로그램 버전 관리
 * @prop description - 확장 프로그램 설명 (__MSG_extensionDescription__는 다국어 지원을 위한 키)
 *
 * @prop host_permissions - 접근 가능한 웹사이트 설정 (<all_urls>는 모든 웹사이트 접근 허용)
 * @prop permissions - 확장 프로그램이 사용할 권한 목록
 *   - storage: 로컬 스토리지 사용 권한
 *   - scripting: 스크립트 실행 권한
 *   - tabs: 탭 정보 접근/제어 권한
 *   - notifications: 알림 표시 권한
 *   - sidePanel: 사이드 패널 사용 권한
 *
 * @prop options_page - 확장 프로그램 설정 페이지 경로
 * @prop action - 확장 프로그램 아이콘 관련 설정
 *   - default_popup: 아이콘 클릭 시 표시될 팝업 페이지
 *   - default_icon: 확장 프로그램 아이콘
 *
 * @prop chrome_url_overrides - Chrome 기본 페이지 오버라이드 설정
 *   - newtab: 새 탭 페이지를 커스텀 페이지로 대체
 *
 * @prop icons - 확장 프로그램 아이콘 크기별 설정
 *
 * @prop content_scripts - 웹 페이지에 주입될 스크립트 설정
 *   - matches: 스크립트가 주입될 웹사이트 패턴
 *   - js: 주입할 자바스크립트 파일
 *   - css: 주입할 CSS 파일
 *
 * @prop web_accessible_resources - 웹 페이지에서 접근 가능한 리소스 설정
 *   - resources: 접근 가능한 파일 패턴
 *   - matches: 접근을 허용할 웹사이트 패턴
 *
 * @prop devtools_page - Chrome 개발자 도구에 추가될 페이지
 * @prop side_panel - Chrome 사이드 패널 설정
 *
 * @prop browser_specific_settings - 브라우저별 특수 설정
 *   - gecko: Firefox 관련 설정
 *     - id: Firefox 확장 프로그램 고유 ID
 *     - strict_min_version: 최소 지원 Firefox 버전
 */
const manifest = {
  manifest_version: 3,
  default_locale: 'en',
  name: '__MSG_extensionName__',
  browser_specific_settings: {
    gecko: {
      id: 'example@example.com',
      strict_min_version: '109.0',
    },
  },
  version: packageJson.version,
  description: '__MSG_extensionDescription__',
  host_permissions: ['<all_urls>'],
  permissions: ['storage', 'scripting', 'tabs', 'notifications', 'sidePanel', 'bookmarks'],
  options_page: 'options/index.html',
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  action: {
    default_popup: 'popup/index.html',
    default_icon: 'icon-34.png',
  },
  chrome_url_overrides: {
    newtab: 'new-tab/index.html',
  },
  icons: {
    128: 'icon-128.png',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      js: ['content/index.iife.js'],
    },
    {
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      js: ['content-ui/index.iife.js'],
    },
    {
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      css: ['content.css'],
    },
  ],
  devtools_page: 'devtools/index.html',
  web_accessible_resources: [
    {
      resources: ['*.js', '*.css', '*.svg', 'icon-128.png', 'icon-34.png'],
      matches: ['*://*/*'],
    },
  ],
  side_panel: {
    default_path: 'side-panel/index.html',
  },
} satisfies chrome.runtime.ManifestV3;

export default manifest;
