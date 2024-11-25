import { FC } from 'hono/jsx'

export const HomePage: FC = () => {
  return (
    <div class="content">
      <div id="profile-info"></div>
      <div class="stats-container">
        <div id="language-stats" class="stats-card"></div>
        <div id="repo-stats" class="stats-card">
          <div id="active-repos"></div>
          <div id="starred-repos"></div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `
        async function refreshAiSummary() {
          const button = document.getElementById('refresh-button');
          const contentDiv = document.getElementById('ai-summary-content');
          const token = localStorage.getItem('github_token');
          
          if (!token) {
            window.location.href = '/login';
            return;
          }

          try {
            button.disabled = true;
            button.innerHTML = i18n.t('profile.refreshing');
            
            contentDiv.innerHTML = \`<div class="loading">\${i18n.t('profile.analyzing')}</div>\`;

            const response = await fetch('/api/refresh-summary', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + token,
                'Accept-Language': i18n.locale
              }
            });
            
            if (!response.ok) {
              throw new Error('刷新失败');
            }

            const data = await response.json();
            contentDiv.innerHTML = \`<p>\${data.summary}</p>\`
          } catch (error) {
            contentDiv.innerHTML = \`<p class="error">刷新失败：\${error.message}</p>\`
          } finally {
            button.disabled = false;
            button.innerHTML = i18n.t('profile.refresh');
          }
        }

        async function loadProfile() {
          const token = localStorage.getItem('github_token');
          if (!token) {
            window.location.href = '/login';
            return;
          }

          try {
            const response = await fetch('/api/detailed-profile', {
              headers: {
                'Authorization': 'Bearer ' + token,
                'Accept-Language': i18n.locale
              }
            });
            
            if (!response.ok) {
              const error = await response.json();
              console.error('API错误:', error);
              throw new Error(error.error || '获取数据失败');
            }

            const data = await response.json();
            if (!data || !data.user) {
              console.error('数据格式错误:', data);
              throw new Error('数据格式错误');
            }

            // 基本信息
            document.getElementById('profile-info').innerHTML = \`
              <div class="profile-header">
                <img src="\${data.user.avatar_url}" width="100" />
                <div class="profile-details">
                  <h2>\${data.user.name || data.user.login}</h2>
                  <p class="bio">\${data.user.bio || ''}</p>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <span class="stat-value">\${data.stats.followers}</span>
                      <span class="stat-label">\${i18n.t('profile.followers')}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">\${data.stats.repos}</span>
                      <span class="stat-label">\${i18n.t('profile.repos')}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">\${data.stats.stars}</span>
                      <span class="stat-label">\${i18n.t('profile.stars')}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">\${data.stats.score}</span>
                      <span class="stat-label">\${i18n.t('profile.score')}</span>
                    </div>
                  </div>
                </div>
              </div>
            \`;

            // 语言统计
            const languageHtml = \`
              <h3>\${i18n.t('profile.commonLanguages')}</h3>
              <div class="language-bars">
                \${data.languages.map(lang => \`
                  <div class="language-bar">
                    <div class="language-name">\${lang.name}</div>
                    <div class="bar-container">
                      <div class="bar" style="width: \${lang.percentage}%"></div>
                      <span class="percentage">\${lang.percentage}%</span>
                    </div>
                  </div>
                \`).join('')}
              </div>
              <div class="ai-summary">
                <div class="ai-summary-header">
                  <h4>\${i18n.t('profile.aiAnalysis')}</h4>
                  <button onclick="refreshAiSummary()" class="refresh-button" id="refresh-button">
                    \${i18n.t('profile.refresh')}
                  </button>
                </div>
                <div id="ai-summary-content">
                  <p>\${data.aiSummary}</p>
                </div>
              </div>
            \`;
            document.getElementById('language-stats').innerHTML = languageHtml;

            // 活跃仓库
            const activeReposHtml = \`
              <h3>\${i18n.t('profile.activeRepos')}</h3>
              <div class="repos-list">
                \${data.activeRepos.map(repo => \`
                  <div class="repo-item">
                    <h4>\${repo.name}</h4>
                    <p>\${repo.description || ''}</p>
                    <div class="repo-meta">
                      \${repo.language ? \`<span class="language">\${repo.language}</span>\` : ''}
                      \${repo.stars > 0 ? \`<span class="stars">⭐ \${repo.stars}</span>\` : ''}
                    </div>
                  </div>
                \`).join('')}
              </div>
            \`;
            document.getElementById('active-repos').innerHTML = activeReposHtml;

            // 星标最多的仓库
            const starredReposHtml = \`
              <h3>\${i18n.t('profile.popularRepos')}</h3>
              <div class="repos-list">
                \${data.starredRepos.map(repo => \`
                  <div class="repo-item">
                    <h4><a href="\${repo.url}" target="_blank">\${repo.name}</a></h4>
                    <p>\${repo.description || ''}</p>
                    <div class="repo-meta">
                      \${repo.language ? \`<span class="language">\${repo.language}</span>\` : ''}
                      <span class="stars">⭐ \${repo.stars}</span>
                    </div>
                  </div>
                \`).join('')}
              </div>
            \`;
            document.getElementById('starred-repos').innerHTML = starredReposHtml;

          } catch (error) {
            console.error('加载配置文件时出错:', error);
            alert('加载失败: ' + error.message);
            localStorage.removeItem('github_token');
            window.location.href = '/login';
          }
        }

        loadProfile();
      `}} />
    </div>
  )
} 