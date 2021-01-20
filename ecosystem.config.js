// Used by PM2 for deployment
// Environment Options: development, production, 
// Additional Logging: log_file: './log/combined.log', out_file: './log/out.log',
module.exports = {
    apps : [{
        cwd: __dirname,
        env: {
            NODE_ENV: "development"
          },
        exec_mode: 'cluster',
        instances: 1,
	watch: false,
        watch_delay: 1000,
	ignore_watch : ["node_modules", "log", "cache"],
	autorestart: true,
        name: "MoSLookup",
	script: "ts-node",
        args: "-r ./node_modules/tsconfig-paths/register ./src/app.ts",
	error_file: './log/err.log' 	

    }]
}