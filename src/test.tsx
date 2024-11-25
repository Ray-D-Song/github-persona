import { Hono } from 'hono'

const app = new Hono<{ Bindings: Bindings }>()

app.post('/generate-test-data', async (c) => {
  const { DB } = c.env
  
  try {
    // 生成100条测试数据
    for (let i = 1; i <= 100; i++) {
      const randomStats = {
        followers: Math.floor(Math.random() * 1000),
        repos: Math.floor(Math.random() * 100),
        stars: Math.floor(Math.random() * 5000),
        commits: Math.floor(Math.random() * 2000),
        prs: Math.floor(Math.random() * 300),
        issues: Math.floor(Math.random() * 200),
        reviews: Math.floor(Math.random() * 400),
        activity: Math.floor(Math.random() * 50)
      }

      // 计算得分
      const score = 
        randomStats.followers * 2 + 
        randomStats.repos * 5 + 
        randomStats.stars * 3 + 
        randomStats.commits * 2 + 
        randomStats.prs * 5 + 
        randomStats.issues * 3 + 
        randomStats.reviews * 4 + 
        randomStats.activity

      await DB.prepare(`
        INSERT OR REPLACE INTO users (
          github_id, login, name, avatar_url,
          followers, public_repos, total_stars,
          total_commits, total_prs, total_issues,
          total_reviews, recent_activity, score,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        `test-${i}`,                                    // github_id
        `test-user-${i}`,                              // login
        `Test User ${i}`,                              // name
        `https://avatars.githubusercontent.com/u/${i}`, // avatar_url
        randomStats.followers,                          // followers
        randomStats.repos,                              // public_repos
        randomStats.stars,                              // total_stars
        randomStats.commits,                            // total_commits
        randomStats.prs,                                // total_prs
        randomStats.issues,                             // total_issues
        randomStats.reviews,                            // total_reviews
        randomStats.activity,                           // recent_activity
        score                                           // score
      ).run()
    }

    return c.json({ success: true, message: '已生成100条测试数据' })
  } catch (error) {
    console.error('生成测试数据失败:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : '生成测试数据失败',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, 500)
  }
})

app.post('/clear-test-data', async (c) => {
  const { DB } = c.env
  
  try {
    await DB.prepare(`
      DELETE FROM users WHERE github_id LIKE 'test-%'
    `).run()
    
    return c.json({ success: true, message: '已清除所有测试数据' })
  } catch (error) {
    console.error('清除测试数据失败:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : '清除测试数据失败',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, 500)
  }
})

export default app