import { Hono } from 'hono';
import type { Handler } from 'hono/types';

const API_BASENAME = '/api';
const api = new Hono();

if (globalThis.fetch) {
  import('../src/__create/fetch').then((m) => {
    globalThis.fetch = m.default;
  }).catch(err => console.error("Failed to patch fetch:", err));
}

// Get the files statically via Vite's glob at build time
const allRoutes = import.meta.glob('../src/app/api/**/route.{js,ts}', { eager: true }) as Record<string, any>;

// Helper function to transform file path to Hono route path
function getHonoPath(routeFile: string): { name: string; pattern: string }[] {
  const relativePath = routeFile.replace('../src/app/api/', '').replace(/\\/g, '/');
  const parts = relativePath.split('/').filter(Boolean);
  const routeParts = parts.slice(0, -1); // Remove 'route.js' or 'route.ts'
  if (routeParts.length === 0) {
    return [{ name: 'root', pattern: '' }];
  }
  const transformedParts = routeParts.map((segment) => {
    const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
    if (match) {
      const [_, dots, param] = match;
      return dots === '...'
        ? { name: param, pattern: `:${param}{.+}` }
        : { name: param, pattern: `:${param}` };
    }
    return { name: segment, pattern: segment };
  });
  return transformedParts;
}

// Import and register all routes
function registerRoutes() {
  const routeFiles = Object.keys(allRoutes).sort((a, b) => b.length - a.length);

  // Clear existing routes
  api.routes = [];

  for (const routeFile of routeFiles) {
    try {
      const route = allRoutes[routeFile];
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        if (route[method]) {
          const parts = getHonoPath(routeFile);
          const honoPath = `/${parts.map(({ pattern }) => pattern).join('/')}`;
          
          const handler: Handler = async (c) => {
            const params = c.req.param();
            return await route[method](c.req.raw, { params });
          };
          
          const methodLowercase = method.toLowerCase();
          switch (methodLowercase) {
            case 'get': api.get(honoPath, handler); break;
            case 'post': api.post(honoPath, handler); break;
            case 'put': api.put(honoPath, handler); break;
            case 'delete': api.delete(honoPath, handler); break;
            case 'patch': api.patch(honoPath, handler); break;
          }
        }
      }
    } catch (error) {
      console.error(`Error importing route file ${routeFile}:`, error);
    }
  }
}

// Initial route registration
registerRoutes();

export { api, API_BASENAME };
