import { FC } from 'hono/jsx'

export const Layout: FC<{ children: any }> = ({ children }) => {
  return (
    <div>
      <nav class="nav">
        <div class="nav-brand">GitHub Persona</div>
        <div class="nav-links">
          <script dangerouslySetInnerHTML={{ __html: `
            function isActive(path) {
              return window.location.pathname === path ? 'active' : '';
            }
          `}} />
          <a href="/" class="nav-link" id="home">主页</a>
          <a href="/leaderboard" class="nav-link" id="leaderboard">排行榜</a>
        </div>
      </nav>
      <main class="container">
        {children}
      </main>
    </div>
  )
} 