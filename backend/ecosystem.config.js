module.exports = {
  apps: [
    {
      name: 'xiaodiyanxuan-api',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 8080
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      // 自动重启配置
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      max_memory_restart: '1G',
      
      // 错误和输出日志
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 自动重启策略
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // 优雅关闭
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // 启动延迟
      wait_ready: true,
      
      // 监听端口
      listen_timeout: 10000,
      
      // 环境变量
      cwd: '/home/devbox/project/1114/client/backend'
    }
  ],
  
  // 集群模式配置
  deploy: {
    production: {
      user: 'devbox',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:repo.git',
      path: '/home/devbox/project/1114/client/backend',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
}
