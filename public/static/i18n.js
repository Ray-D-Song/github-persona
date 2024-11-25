// 语言包
const messages = {
  en: {
    nav: {
      home: 'Home',
      leaderboard: 'Leaderboard',
      brand: 'GitHub Persona',
      sourceCode: 'Source Code'
    },
    leaderboard: {
      title: 'GitHub Leaderboard',
      search: 'Search users...',
      searchButton: 'Search',
      columns: {
        rank: 'Rank',
        user: 'User',
        score: 'Score',
        repos: 'Repos',
        stars: 'Stars',
        commits: 'Commits',
        prs: 'PRs',
        issues: 'Issues',
        reviews: 'Reviews',
        activity: 'Recent Activity'
      },
      pagination: {
        prev: 'Previous',
        next: 'Next',
        page: 'Page ${page} of ${total}'
      },
      sync: 'Sync My Data',
      syncFailed: 'Sync failed: ${error}'
    },
    profile: {
      followers: 'Followers',
      repos: 'Repositories',
      stars: 'Stars',
      score: 'Score',
      commonLanguages: 'Common Languages',
      aiAnalysis: 'AI Analysis',
      refresh: 'Refresh',
      refreshing: 'Refreshing...',
      analyzing: 'Analyzing...',
      activeRepos: 'Recent Active Repos',
      popularRepos: 'Popular Repos',
      loadFailed: 'Load Failed',
      refreshFailed: 'Refresh Failed'
    },
    errors: {
      aiBindingNotFound: 'Unable to generate analysis report',
      generateFailed: 'Failed to generate analysis report',
      saveFailed: 'Failed to save analysis report'
    }
  },
  ja: {
    nav: {
      home: 'ホーム',
      leaderboard: 'ランキング',
      brand: 'GitHub Persona',
      sourceCode: 'ソースコード'
    },
    leaderboard: {
      title: 'GitHub ランキング',
      search: 'ユーザーを検索...',
      searchButton: '検索',
      columns: {
        rank: '順位',
        user: 'ユーザー',
        score: 'スコア',
        repos: 'リポジトリ',
        stars: 'スター',
        commits: 'コミット',
        prs: 'PR',
        issues: 'Issue',
        reviews: 'レビュー',
        activity: '最近の活動'
      },
      pagination: {
        prev: '前へ',
        next: '次へ',
        page: '${page}ページ / ${total}ページ'
      },
      sync: 'データを同期',
      syncFailed: '同期失敗: ${error}'
    },
    profile: {
      followers: 'フォロワー',
      repos: 'リポジトリ',
      stars: 'スター',
      score: 'スコア',
      commonLanguages: '使用言語',
      aiAnalysis: 'AI分析',
      refresh: '更新',
      refreshing: '更新中...',
      analyzing: '分析中...',
      activeRepos: '最近のアクティブなリポジトリ',
      popularRepos: '人気のリポジトリ',
      loadFailed: '読み込み失敗',
      refreshFailed: '更新失敗'
    },
    errors: {
      aiBindingNotFound: '分析レポートを生成できません',
      generateFailed: '分析レポートの生成に失敗しました',
      saveFailed: '分析レポートの保存に失敗しました'
    }
  },
  zh: {
    nav: {
      home: '主页',
      leaderboard: '排行榜',
      brand: 'GitHub Persona',
      sourceCode: '源代码'
    },
    leaderboard: {
      title: 'GitHub 排行榜',
      search: '搜索用户...',
      searchButton: '搜索',
      columns: {
        rank: '排名',
        user: '用户',
        score: '得分',
        repos: '仓库数',
        stars: 'Stars',
        commits: '提交数',
        prs: 'PR数',
        issues: 'Issue数',
        reviews: 'Reviews',
        activity: '最近活动'
      },
      pagination: {
        prev: '上一页',
        next: '下一页',
        page: '第 ${page} 页 / 共 ${total} 页'
      },
      sync: '同步我的数据',
      syncFailed: '同步失败：${error}'
    },
    profile: {
      followers: '关注者',
      repos: '仓库',
      stars: '获得星标',
      score: '总分',
      commonLanguages: '常用语言',
      aiAnalysis: 'AI 分析',
      refresh: '刷新分析',
      refreshing: '刷新中...',
      analyzing: '分析中...',
      activeRepos: '最近活跃的仓库',
      popularRepos: '最受欢迎的仓库',
      loadFailed: '加载失败',
      refreshFailed: '刷新失败'
    },
    errors: {
      aiBindingNotFound: '暂时无法生成分析报告',
      generateFailed: '生成分析报告失败',
      saveFailed: '保存分析报告失败'
    }
  }
};

class I18n {
  constructor(locale = 'en') {
    this.locale = locale;
  }

  t(path, params = {}) {
    const message = this.getMessage(path);
    return this.interpolate(message, params);
  }

  getMessage(path) {
    const keys = path.split('.');
    let message = messages[this.locale];
    
    for (const key of keys) {
      message = message[key];
    }

    return message || path;
  }

  interpolate(message, params) {
    return message.replace(/\${(\w+)}/g, (_, key) => params[key] || '');
  }

  static detectLocale() {
    if (typeof navigator === 'undefined') return 'en';
    
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('zh')) return 'zh';
    if (lang.startsWith('ja')) return 'ja';
    return 'en';
  }
}

// 确保全局可用
window.I18n = I18n; 