import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';

const isDocker = process.env.ADAPTER === 'node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: isDocker
			? adapterNode()
			: adapterVercel({
					runtime: 'nodejs22.x',
					maxDuration: 60
				})
	}
};

export default config;
