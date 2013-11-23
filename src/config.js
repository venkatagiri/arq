module.exports = {
  // Server Port
  port: process.env.PORT || 8080,

  // MongoDB
  mongodbUrl: process.env.MONGODB_URL,

  // Reddit Auth
  redditKey: process.env.REDDIT_KEY,
  redditSecret: process.env.REDDIT_SECRET,
  redditCallback: process.env.REDDIT_CALLBACK,

  // Reddit API Endpoints
  url: {
    authorization: "https://ssl.reddit.com/api/v1/authorize",
    accessToken: "https://ssl.reddit.com/api/v1/access_token",
    details: "https://oauth.reddit.com/api/v1/me.json",
    submit: "https://oauth.reddit.com/api/submit"
  }
};
