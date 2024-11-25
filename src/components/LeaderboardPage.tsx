import { FC } from 'hono/jsx'

export const LeaderboardPage: FC<{ 
  users: User[]
  total: number 
  page: number
  query: string
}> = ({ users, total, page, query }) => {
  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)
  
  return (
    <div class="content">
      <h1><script dangerouslySetInnerHTML={{ __html: 'document.write(i18n.t("leaderboard.title"))' }} /></h1>
      
      <div class="search-bar">
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
                throw new Error(i18n.t('leaderboard.syncFailed'));
              }

              window.location.reload();
            } catch (error) {
              alert(i18n.t('leaderboard.syncFailed', { error: error.message }));
            }
          }

          function handleSearch(e) {
            try {
              e.preventDefault();
              const query = document.getElementById('search').value;
              window.location.href = '/leaderboard?query=' + encodeURIComponent(query);
            } catch (error) {
              alert(i18n.t('leaderboard.syncFailed', { error: error.message }));
            }
          }
        `}} />
        <div class="search-controls">
          <form class="search-form" onsubmit="handleSearch(event)">
            <input 
              type="search" 
              id="search"
              value={query}
            />
            <button type="submit">
              <script dangerouslySetInnerHTML={{ __html: 'document.write(i18n.t("leaderboard.searchButton"))' }} />
            </button>
          </form>
          <button onclick="syncStats()" class="sync-button">
            <script dangerouslySetInnerHTML={{ __html: 'document.write(i18n.t("leaderboard.sync"))' }} />
          </button>
        </div>
      </div>

      <div class="leaderboard">
        <table>
          <thead>
            <tr>
              <th><script dangerouslySetInnerHTML={{ __html: 'document.write(i18n.t("leaderboard.columns.rank"))' }} /></th>
              <th><script dangerouslySetInnerHTML={{ __html: 'document.write(i18n.t("leaderboard.columns.user"))' }} /></th>
              <th><script dangerouslySetInnerHTML={{ __html: 'document.write(i18n.t("leaderboard.columns.score"))' }} /></th>
              <th><script dangerouslySetInnerHTML={{ __html: 'document.write(i18n.t("leaderboard.columns.repos"))' }} /></th>
              <th><script dangerouslySetInnerHTML={{ __html: 'document.write(i18n.t("leaderboard.columns.stars"))' }} /></th>
              <th><script dangerouslySetInnerHTML={{ __html: 'document.write(i18n.t("leaderboard.columns.commits"))' }} /></th>
              <th><script dangerouslySetInnerHTML={{ __html: 'document.write(i18n.t("leaderboard.columns.prs"))' }} /></th>
              <th><script dangerouslySetInnerHTML={{ __html: 'document.write(i18n.t("leaderboard.columns.issues"))' }} /></th>
              <th><script dangerouslySetInnerHTML={{ __html: 'document.write(i18n.t("leaderboard.columns.reviews"))' }} /></th>
              <th><script dangerouslySetInnerHTML={{ __html: 'document.write(i18n.t("leaderboard.columns.activity"))' }} /></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr>
                <td>{(page - 1) * pageSize + index + 1}</td>
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

      <div class="pagination">
        <script dangerouslySetInnerHTML={{ __html: `
          function goToPage(pageNum) {
            const url = new URL(window.location.href);
            url.searchParams.set('page', pageNum);
            window.location.href = url.toString();
          }
        `}} />
        {page > 1 && (
          <button onclick={`goToPage(${page - 1})`}>Previous</button>
        )}
        <span class="page-info">Page {page} of {totalPages}</span>
        {page < totalPages && (
          <button onclick={`goToPage(${page + 1})`}>Next</button>
        )}
      </div>
    </div>
  )
} 