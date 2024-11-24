import { FC } from 'hono/jsx'


export const LeaderboardPage: FC<{ users: User[] }> = ({ users }) => {
  return (
    <div class="content">
      <h1>GitHub 排行榜</h1>
      <div class="leaderboard">
        <table>
          <thead>
            <tr>
              <th>排名</th>
              <th>用户</th>
              <th>得分</th>
              <th>仓库数</th>
              <th>Stars</th>
              <th>提交数</th>
              <th>PR数</th>
              <th>Issue数</th>
              <th>Reviews</th>
              <th>最近活动</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr>
                <td>{index + 1}</td>
                <td class="user-cell">
                  <img src={user.avatar_url} width="40" height="40" />
                  <span>{user.name || user.login}</span>
                </td>
                <td>{user.score}</td>
                <td>{user.public_repos}</td>
                <td>{user.total_stars}</td>
                <td>{user.total_commits}</td>
                <td>{user.total_prs}</td>
                <td>{user.total_issues}</td>
                <td>{user.total_reviews}</td>
                <td>{user.recent_activity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div class="sync-button">
        <script dangerouslySetInnerHTML={{ __html: `
          async function syncStats() {
            const token = localStorage.getItem('github_token');
            if (!token) {
              window.location.href = '/login';
              return;
            }

            try {
              const response = await fetch('/api/sync-stats', {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + token
                }
              });
              
              if (!response.ok) {
                throw new Error('同步失败');
              }

              window.location.reload();
            } catch (error) {
              alert('同步失败：' + error.message);
            }
          }
        `}} />
        <button onclick="syncStats()">同步我的数据</button>
      </div>
    </div>
  )
} 