import { Octokit } from 'octokit'
import { Bindings } from '../types/bindings'

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

  async getDetailedProfile(env: Bindings) {
    const [user, stats, languages, activeRepos, starredRepos] = await Promise.all([
      this.getUser(),
      this.getUserStats(),
      this.getLanguageStats(3),
      this.getActiveRepositories(3),
      this.getTopStarredRepositories(3)
    ])

    const aiSummary = await this.generateUserSummary(env, languages, starredRepos)

    return {
      user,
      stats: stats.stats,
      languages,
      activeRepos,
      starredRepos,
      aiSummary
    }
  }

  private async getLanguageStats(limit: number = 3) {
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

  private async getTopStarredRepositories(limit: number = 3) {
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

  private async generateUserSummary(env: Bindings, languages: any[], repos: any[]) {
    console.log(env.AI.run)
    if (!env?.AI) {
      console.error('AI binding not found')
      return '暂时无法生成分析报告'
    }

    const systemPrompt = '你是一个 GitHub 用户分析专家，请根据用户的编程语言使用情况和代表性项目，分析其技术特点和专业方向。'
    
    const userPrompt = `主要编程语言：${languages.map(l => `${l.name}(${l.percentage}%)`).join(', ')}

代表性项目：
${repos.map(r => `- ${r.name}: ${r.description || '无描述'} (${r.stars} stars)`).join('\n')}

请使用中文生成一段简短的用户画像总结（不超过100字）。`

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]

      console.log('Sending request to AI with messages:', messages)

      const result = await env.AI.run('@cf/mistral/mistral-7b-instruct-v0.2-lora', {
        stream: false,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.9,
        messages
      })

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
}