import { jsxRenderer } from 'hono/jsx-renderer'
import { Layout } from './components/Layout'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
        <link href="/static/style.css" rel="stylesheet" />
        <link href="/static/logo.svg" rel="icon" />
        <script src="/static/i18n.js"></script>
        <script dangerouslySetInnerHTML={{ __html: `
          // 全局初始化 i18n
          const storedLang = localStorage.getItem('lang');
          window.i18n = new I18n(storedLang || I18n.detectLocale());
        `}} />
      </head>
      <body>
        <Layout>{children}</Layout>
        <script dangerouslySetInnerHTML={{ __html: `
          // 设置当前语言选择器的值
          document.querySelector('.lang-select').value = i18n.locale;
          
          // 设置导航栏激活状态
          document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('href') === window.location.pathname) {
              link.classList.add('active');
            }
          });
        `}} />
      </body>
    </html>
  )
})
