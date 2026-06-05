import type { Config } from '@react-router/dev/config';

export default {
	appDirectory: './src/app',
	ssr: process.env.VITE_SPA_MODE === 'true' ? false : true,
} satisfies Config;
