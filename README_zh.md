# GitHub Persona

## 这是什么？

这是一个简单的应用程序，分析你的 GitHub 活动，生成分析报告和打分，并用这个分数在社区中进行排名。  

## 部署

首先你需要获取 Github OAuth 的 Client ID 和 Client Secret。获得方式参考 [这里](https://docs.github.com/en/developers/apps/creating-an-app)。  

接下来你可以使用下面的按钮部署到 Cloudflare Workers。  
这会自动创建一个 Fork，在 Fork 仓库的设置(Settings) -> 密钥(Secrets)中填入你刚刚获取的 CLIENT_ID 和 CLIENT_SECRET。

最后手动触发一次 Github Actions，完成部署。

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ray-d-song/github-persona)