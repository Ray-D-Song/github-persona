import { Octokit } from 'octokit'

export class GitHubClient {
  private octokit: Octokit

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token
    })
  }

  async getUser() {
    const { data } = await this.octokit.rest.users.getAuthenticated()
    return data
  }

  async getUserStats() {
    const user = await this.getUser()
    const [repos, contributions, events] = await Promise.all([
      this.getRepos(),
      this.getContributions(),
      this.getRecentEvents()
    ])

    const score = this.calculateScore({
      followers: user.followers,
      publicRepos: repos.length,
      stars: repos.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0),
      contributions: contributions,
      recentActivity: events.length
    })

    return {
      user,
      stats: {
        repos: repos.length,
        stars: repos.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0),
        followers: user.followers,
        contributions,
        recentActivity: events.length,
        score
      }
    }
  }

  private async getRepos() {
    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100
    })
    return data
  }

  private async getContributions() {
    const user = await this.getUser()
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            totalCommitContributions
            totalIssueContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
          }
        }
      }
    `
    
    const { user: { contributionsCollection } } = (await this.octokit.graphql(query, {
      username: user.login
    })) as { user: { contributionsCollection: any } }
    
    return contributionsCollection
  }

  private async getRecentEvents() {
    const user = await this.getUser()
    const { data } = await this.octokit.rest.activity.listPublicEventsForUser({
      username: user.login,
      per_page: 100
    })
    return data
  }

  private calculateScore(stats: {
    followers: number,
    publicRepos: number,
    stars: number,
    contributions: any,
    recentActivity: number
  }) {
    // 基础分数
    let score = 0
    
    // 关注者得分 (每个关注者 2 分)
    score += stats.followers * 2
    
    // 仓库得分 (每个仓库 5 分)
    score += stats.publicRepos * 5
    
    // star 得分 (每个 star 3 分)
    score += stats.stars * 3
    
    // 贡献得分
    score += stats.contributions.totalCommitContributions * 2
    score += stats.contributions.totalIssueContributions * 3
    score += stats.contributions.totalPullRequestContributions * 5
    score += stats.contributions.totalPullRequestReviewContributions * 4
    
    // 最近活动得分 (每个活动 1 分)
    score += stats.recentActivity
    
    return Math.round(score)
  }

  async getDetailedProfile(env: Bindings, locale: string = 'en') {
    const [user, stats, languages, activeRepos, starredRepos] = await Promise.all([
      this.getUser(),
      this.getUserStats(),
      this.getLanguageStats(3),
      this.getActiveRepositories(3),
      this.getTopStarredRepositories(3)
    ]);

    // 尝试从数据库获取已存在的 AI 总结
    let aiSummary = ''
    try {
      const result = (await env.DB.prepare(
        'SELECT summary FROM user_summaries WHERE github_id = ?'
      ).bind(user.id.toString()).first()) as { summary: string }
      
      if (result?.summary) {
        aiSummary = result.summary;
      } else {
        aiSummary = await this.generateAndSaveUserSummary(env, user.id.toString(), languages, starredRepos, locale);
      }
    } catch (error) {
      console.error('获取 AI 总结失败:', error);
      aiSummary = '获取分析报告失败';
    }

    return {
      user,
      stats: stats.stats,
      languages,
      activeRepos,
      starredRepos,
      aiSummary
    };
  }

  async getLanguageStats(limit: number = 3) {
    const repos = await this.getRepos()
    const languageMap: Record<string, number> = {}
    
    for (const repo of repos) {
      if (repo.language) {
        languageMap[repo.language] = (languageMap[repo.language] || 0) + 1
      }
    }

    const total = Object.values(languageMap).reduce((a, b) => a + b, 0)
    return Object.entries(languageMap)
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, limit)
  }

  private async getActiveRepositories(limit: number = 3) {
    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      sort: 'pushed',
      per_page: limit
    })
    
    return Promise.all(
      data.map(async (repo) => {
        const { data: commits } = await this.octokit.rest.repos.listCommits({
          owner: repo.owner.login,
          repo: repo.name,
          per_page: 1
        }).catch(() => ({ data: [] }))

        return {
          name: repo.name,
          description: repo.description,
          stars: repo.stargazers_count,
          language: repo.language,
          lastCommit: commits[0]?.commit?.author?.date
        }
      })
    )
  }

  async getTopStarredRepositories(limit: number = 3) {
    const repos = await this.getRepos()
    
    return repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, limit)
      .map(repo => ({
        name: repo.name,
        description: repo.description,
        stars: repo.stargazers_count,
        language: repo.language,
        url: repo.html_url
      }))
  }

  private async generateUserSummary(env: Bindings, languages: any[], repos: any[], locale: string = 'en') {
    if (!env?.AI) {
      console.error('AI binding not found')
      return '暂时无法生成分析报告'
    }

    // 根据不同语言设置系统提示语
    const systemPrompts = {
      en: 'You are a GitHub user analysis expert. Please analyze the user\'s technical characteristics and professional direction based on their programming language usage and representative projects.',
      ja: 'あなたはGitHubユーザー分析の専門家です。ユーザーのプログラミング言語の使用状況と代表的なプロジェクトに基づいて、技術的特徴と専門分野を分析してください。',
      zh: '你是一个 GitHub 用户分析专家，请根据用户的编程语言使用情况和代表性项目，分析其技术特点和专业方向。'
    }

    const userPrompts = {
      en: `Main programming languages: ${languages.map(l => `${l.name}(${l.percentage}%)`).join(', ')}

Representative projects:
${repos.map(r => `- ${r.name}: ${r.description || 'No description'} (${r.stars} stars)`).join('\n')}

Please generate a brief user profile summary in English (no more than 200 words).`,
      ja: `主なプログラミング言語：${languages.map(l => `${l.name}(${l.percentage}%)`).join(', ')}

代表的なプロジェクト：
${repos.map(r => `- ${r.name}: ${r.description || '説明なし'} (${r.stars} stars)`).join('\n')}

日本語で簡潔なユーザープロフィールの要約を生成してください（200文字以内）。`,
      zh: `主要编程语言：${languages.map(l => `${l.name}(${l.percentage}%)`).join(', ')}

代表性项目：
${repos.map(r => `- ${r.name}: ${r.description || '无描述'} (${r.stars} stars)`).join('\n')}

请使用中文生成一段简短的用户画像总结（不超过200字）。`
    }

    try {
      const messages = [
        { role: 'system', content: systemPrompts[locale] || systemPrompts.en },
        { role: 'user', content: userPrompts[locale] || userPrompts.en }
      ]

      console.log('Sending request to AI with messages:', messages)

      const result = (await env.AI.run('@cf/mistral/mistral-7b-instruct-v0.2-lora', {
        stream: false,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.9,
        messages
      })) as { response: string }

      console.log('AI response:', result)

      if (!result?.response) {
        console.error('Empty response from AI')
        return '暂时无法生成分析报告'
      }

      return result.response
    } catch (error) {
      console.error('AI 分析失败:', error)
      return '暂时无法生成分析报告 - ' + (error instanceof Error ? error.message : String(error))
    }
  }

  async generateAndSaveUserSummary(
    env: Bindings, 
    githubId: string, 
    languages: any[], 
    repos: any[],
    locale: string = 'en'
  ) {
    const summary = await this.generateUserSummary(env, languages, repos, locale);
    
    try {
      await env.DB.prepare(
        `INSERT OR REPLACE INTO user_summaries (github_id, summary) 
         VALUES (?, ?)`
      ).bind(githubId, summary).run();
    } catch (error) {
      console.error('保存 AI 总结失败:', error);
    }
    
    return summary;
  }
}