import { jsxRenderer } from 'hono/jsx-renderer'
import { Layout } from './components/Layout'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
        <link href="/static/style.css" rel="stylesheet" />
      </head>
      <body>
        <Layout>{children}</Layout>
        <script dangerouslySetInnerHTML={{ __html: `
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
