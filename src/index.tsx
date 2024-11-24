import { Hono } from 'hono'
import { renderer } from './renderer'
import { LoginPage } from './components/LoginPage'
import { HomePage } from './components/HomePage'
import { GitHubClient } from './utils/github'
import type { Bindings } from './types/bindings'
import { LeaderboardPage } from './components/LeaderboardPage'

const app = new Hono<{ Bindings: Bindings }>()

app.use(renderer)

app.get('/', (c) => {
  const { GITHUB_CLIENT_ID, REDIRECT_URI } = c.env
  return c.render(<HomePage githubClientId={GITHUB_CLIENT_ID} redirectUri={REDIRECT_URI} />)
})

app.get('/login', (c) => {
  const { GITHUB_CLIENT_ID, REDIRECT_URI } = c.env
  return c.render(<LoginPage githubClientId={GITHUB_CLIENT_ID} redirectUri={REDIRECT_URI} />)
})

app.get('/api/profile', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ error: 'No authorization header' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  try {
    const github = new GitHubClient(token)
    const userData = await github.getUser()
    return c.json(userData)
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

app.get('/callback', async (c) => {
  const code = c.req.query('code')
  
  if (!code) {
    return c.redirect('/login')
  }

  try {
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, REDIRECT_URI } = c.env
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI
      })
    })

    const data = await tokenResponse.json() as { access_token: string }
    
    return c.render(
      <script dangerouslySetInnerHTML={{ __html: `
        localStorage.setItem('github_token', '${data.access_token}');
        window.location.href = '/';
      `}} />
    )
  } catch (error) {
    console.error('Error:', error)
    return c.redirect('/login')
  }
})

app.get('/leaderboard', async (c) => {
  const { DB } = c.env
  const users = await DB.prepare(
    'SELECT * FROM users ORDER BY score DESC LIMIT 100'
  ).all()
  
  return c.render(
    <LeaderboardPage users={users.results as unknown as User[]} />
  )
})

app.post('/api/sync-stats', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ error: 'No authorization header' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const github = new GitHubClient(token)
  
  try {
    const { user, stats } = await github.getUserStats()
    
    const stmt = c.env.DB.prepare(`
      INSERT OR REPLACE INTO users (
        github_id, login, name, avatar_url, 
        followers, public_repos, total_stars,
        total_commits, total_prs, total_issues, 
        total_reviews, recent_activity, score,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)

    if (!stmt) {
      throw new Error('Failed to prepare SQL statement')
    }

    const result = await stmt.bind(
      user.id,
      user.login,
      user.name,
      user.avatar_url,
      stats.followers,
      stats.repos,
      stats.stars,
      stats.contributions.totalCommitContributions,
      stats.contributions.totalPullRequestContributions,
      stats.contributions.totalIssueContributions,
      stats.contributions.totalPullRequestReviewContributions,
      stats.recentActivity,
      stats.score
    ).run()

    if (!result) {
      throw new Error('Failed to execute SQL statement')
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('同步数据失败:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to sync stats',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, 500)
  }
})

app.get('/api/detailed-profile', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ error: 'No authorization header' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  try {
    const github = new GitHubClient(token)
    const profileData = await github.getDetailedProfile(c.env)
    return c.json(profileData)
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Invalid token',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, 401)
  }
})

export default app
