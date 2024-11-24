import { FC } from 'hono/jsx'

export const LoginPage: FC<{ githubClientId: string, redirectUri: string }> = ({ githubClientId, redirectUri }) => {
  return (
    <div>
      <h1>Welcome to GitHub Persona</h1>
      <p>Please login with your GitHub account</p>
      <script dangerouslySetInnerHTML={{ __html: `
        function login() {
          const clientId = '${githubClientId}';
          const redirectUri = '${redirectUri}';
          const scope = 'read:user';
          
          window.location.href = 'https://github.com/login/oauth/authorize?' + 
            'client_id=' + clientId + 
            '&redirect_uri=' + encodeURIComponent(redirectUri) +
            '&scope=' + scope;
        }
      `}} />
      <button onclick="login()">Login with GitHub</button>
    </div>
  )
} 