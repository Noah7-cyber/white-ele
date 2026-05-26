module.exports = {
  apps: [
    {
      name: "web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/home/ubuntu/whitepenguin",

      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_AUTH_APP_SUBDOMAIN: "app",
        NEXT_PUBLIC_APP_DOMAIN: "whitepenguin.co",
        NEXT_PUBLIC_API_URL: "https://api.whitepenguin.co",
        WEBSOCKET_URL: "https://api.whitepenguin.co"
      }
    }
  ]
};



