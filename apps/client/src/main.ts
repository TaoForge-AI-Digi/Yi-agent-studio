import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { i18n } from './i18n'
import App from './App.vue'
import './styles/global.scss'
import 'katex/dist/katex.min.css'

// ponytail: 奕默认亮色主题 (用户偏好)
// 不强制设 dark; 让 useTheme 走 system 偏好; theme switch 切 light/dark
if (!localStorage.getItem('yi_brightness')) {
  localStorage.setItem('yi_brightness', 'light')
}

const savedBrightness = localStorage.getItem('yi_brightness') || 'system'
const savedStyle = localStorage.getItem('yi_style') || 'ink'

// Resolve dark mode
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const isDark = savedBrightness === 'dark' || (savedBrightness === 'system' && prefersDark)

// Resolve style
const isComic = savedStyle === 'comic'
const isDesktopShell =
  (window as typeof window & { yiDesktop?: { isDesktop?: boolean } }).yiDesktop?.isDesktop === true

// Apply classes to prevent FOUC
if (isDark) {
  document.documentElement.classList.add('dark')
}
if (isComic) {
  document.documentElement.classList.add('comic')
}
if (isDesktopShell) {
  document.documentElement.classList.add('yi-desktop-shell')
}

// Read token from URL BEFORE router initializes (hash router strips params)
const urlParams = new URLSearchParams(window.location.search)
const hashQuery = window.location.hash.split('?')[1]
const urlToken = urlParams.get('token') || (hashQuery ? new URLSearchParams(hashQuery).get('token') : null)
if (urlToken) {
  ;(window as any).__LOGIN_TOKEN__ = urlToken
}

const app = createApp(App)
app.use(createPinia())
app.use(i18n)
app.use(router)
router.isReady().finally(() => {
  app.mount('#app')
})
