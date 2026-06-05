import { AsyncLocalStorage } from 'node:async_hooks';
import nodeConsole from 'node:console';
import { skipCSRFCheck } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import Google from '@auth/core/providers/google';
import { authHandler, initAuthConfig } from '@hono/auth-js';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as bcrypt from 'bcryptjs';
import { Hono } from 'hono';
import { contextStorage, getContext } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { proxy } from 'hono/proxy';
import { bodyLimit } from 'hono/body-limit';
import { requestId } from 'hono/request-id';
import { serializeError } from 'serialize-error';
import ws from 'ws';
import NeonAdapter from './adapter';
import { getHTMLForErrorPage } from './get-html-for-error-page';
import { isAuthAction } from './is-auth-action';
import { API_BASENAME, api } from './route-builder';
neonConfig.webSocketConstructor = ws;

const als = new AsyncLocalStorage<{ requestId: string }>();

for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  const original = nodeConsole[method].bind(console);

  console[method] = (...args: unknown[]) => {
    const requestId = als.getStore()?.requestId;
    if (requestId) {
      original(`[traceId:${requestId}]`, ...args);
    } else {
      original(...args);
    }
  };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = NeonAdapter(pool);

const app = new Hono();

app.use('*', requestId());

app.use('*', (c, next) => {
  const requestId = c.get('requestId');
  return als.run({ requestId }, () => next());
});

app.use(contextStorage());

app.onError((err, c) => {
  if (c.req.method !== 'GET') {
    return c.json(
      {
        error: 'An error occurred in your app',
        details: serializeError(err),
      },
      500
    );
  }
  return c.html(getHTMLForErrorPage(err), 200);
});

if (process.env.CORS_ORIGINS) {
  app.use(
    '/*',
    cors({
      origin: process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    })
  );
}
for (const method of ['post', 'put', 'patch'] as const) {
  app[method](
    '*',
    bodyLimit({
      maxSize: 4.5 * 1024 * 1024, // 4.5mb to match vercel limit
      onError: (c) => {
        return c.json({ error: 'Body size limit exceeded' }, 413);
      },
    })
  );
}
// One-time cleanup: remove any base64 images stored in the database
(async () => {
  try {
    await pool.query(`UPDATE auth_users SET image = NULL WHERE image LIKE 'data:%'`);
    console.log('[Startup] Cleaned base64 images from auth_users');
  } catch (e) {
    console.error('[Startup] DB cleanup error:', e.message);
  }
})();

// Middleware to detect oversized auth cookies and auto-clear them
app.use('*', async (c, next) => {
  const cookieHeader = c.req.header('cookie') || '';
  // If cookie header is larger than 8KB, it's likely bloated with base64 image data
  if (cookieHeader.length > 8000) {
    const isAuthPage = c.req.path.startsWith('/api/auth');
    if (!isAuthPage) {
      // Clear all auth cookies and redirect to login
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/login',
          'Set-Cookie': [
            'authjs.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None',
            '__Secure-authjs.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None',
            'authjs.callback-url=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=None',
            '__Secure-authjs.callback-url=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=None',
            'authjs.csrf-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=None',
            '__Secure-authjs.csrf-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=None',
          ].join(', '),
        }
      });
    }
  }
  return next();
});

if (process.env.AUTH_SECRET) {
  app.use(
    '*',
    initAuthConfig((c) => ({
      secret: process.env.AUTH_SECRET,
      trustHost: true,
      basePath: '/api/auth',
      adapter: adapter,
      logger: {
        error(code, ...message) {
          console.error(`[Auth.js Error] ${code}`, ...message);
        },
        warn(code, ...message) {
          console.warn(`[Auth.js Warn] ${code}`, ...message);
        },
        debug(code, ...message) {
          console.log(`[Auth.js Debug] ${code}`, ...message);
        },
      },
      pages: {
        signIn: '/login',
      },
      skipCSRFCheck,
      session: {
        strategy: 'jwt',
      },
      callbacks: {
        async jwt({ token, user, account, profile }) {
          // When signing in, strip base64 images from the token to keep the cookie small
          if (user?.image && user.image.startsWith('data:')) {
            token.picture = undefined;
          }
          // Also strip if token already has a huge picture
          if (token.picture && typeof token.picture === 'string' && token.picture.startsWith('data:')) {
            token.picture = undefined;
          }
          return token;
        },
        async session({ session, token }) {
          if (token.sub) {
            session.user.id = token.sub;
            try {
              const dbUser = await adapter.getUser(token.sub);
              session.user.needsOnboarding = !dbUser?.dob || !dbUser?.country;
              session.user.isBanned = dbUser?.is_banned === true;
              // Only include the image if it's a short URL (Google avatar), NOT a huge base64 string
              if (dbUser?.image && !dbUser.image.startsWith('data:')) {
                session.user.image = dbUser.image;
              }
            } catch(e) {
              session.user.needsOnboarding = false;
            }
          }
          return session;
        },
      },
      cookies: {
        csrfToken: {
          options: {
            secure: true,
            sameSite: 'none',
          },
        },
        sessionToken: {
          options: {
            secure: true,
            sameSite: 'none',
          },
        },
        callbackUrl: {
          options: {
            secure: true,
            sameSite: 'none',
          },
        },
      },
      providers: [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          allowDangerousEmailAccountLinking: true,
          authorization: {
            params: {
              prompt: "select_account",
            },
          },
        }),
        // Dev-only provider for simulated social sign-in (Google, Facebook, etc.)
        // Creates or finds a user by email without requiring a password.
        ...(process.env.NEXT_PUBLIC_CREATE_ENV === 'DEVELOPMENT'
          ? [
              Credentials({
                id: 'dev-social',
                name: 'Development Social Sign-in',
                credentials: {
                  email: { label: 'Email', type: 'email' },
                  name: { label: 'Name', type: 'text' },
                  provider: { label: 'Provider', type: 'text' },
                },
                authorize: async (credentials) => {
                  const { email, name, provider } = credentials;
                  if (!email || typeof email !== 'string') return null;

                  const existing = await adapter.getUserByEmail(email);
                  if (existing) return existing;

                  const allowedProviders = new Set(['google', 'facebook', 'twitter', 'apple']);
                  const providerName =
                    typeof provider === 'string' && allowedProviders.has(provider.toLowerCase())
                      ? provider.toLowerCase()
                      : 'google';
                  const newUser = await adapter.createUser({
                    emailVerified: null,
                    email,
                    name:
                      typeof name === 'string' && name.length > 0
                        ? name
                        : undefined,
                  });
                  await adapter.linkAccount({
                    type: 'oauth',
                    userId: newUser.id,
                    provider: providerName,
                    providerAccountId: `dev-${newUser.id}`,
                  });
                  return newUser;
                },
              }),
            ]
          : []),
        Credentials({
          id: 'credentials-signin',
          name: 'Credentials Sign in',
          credentials: {
            email: {
              label: 'Email',
              type: 'email',
            },
            password: {
              label: 'Password',
              type: 'password',
            },
          },
          authorize: async (credentials) => {
            console.log('--- SIGN IN ATTEMPT ---');
            const { email, password } = credentials;
            if (!email || !password) {
              console.log('Missing email or password');
              return null;
            }
            if (typeof email !== 'string' || typeof password !== 'string') {
              console.log('Invalid types');
              return null;
            }

            // logic to verify if user exists
            const normalizedEmail = email.toLowerCase();
            const user = await adapter.getUserByEmail(normalizedEmail);
            if (!user) {
              console.log('User not found by email:', normalizedEmail);
              return null;
            }
            const matchingAccount = user.accounts.find(
              (account) => account.provider === 'credentials'
            );
            const accountPassword = matchingAccount?.password;
            if (!accountPassword) {
              console.log('No credentials account or password found for user');
              return null;
            }

            console.log('Found password hash:', accountPassword);
            const isValid = await bcrypt.compare(password, accountPassword);
            console.log('Password valid?:', isValid);
            if (!isValid) {
              return null;
            }

            console.log('Sign in successful!');
            return user;
          },
        }),
        Credentials({
          id: 'credentials-signup',
          name: 'Credentials Signup',
          credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
            name: { label: 'Name', type: 'text' },
            gender: { label: 'Gender', type: 'text' },
            dob: { label: 'Date of Birth', type: 'date' },
            country: { label: 'Country', type: 'text' },
          },
          authorize: async (credentials) => {
            console.log('CREDENTIALS RECEIVED:', credentials);
            const { email, password, name, gender, dob, country } = credentials;
            if (!email || !password) {
              console.log('MISSING EMAIL OR PASSWORD');
              return null;
            }
            if (typeof email !== 'string' || typeof password !== 'string') {
              console.log('EMAIL OR PASSWORD NOT STRING');
              return null;
            }

            const normalizedEmail = email.toLowerCase();
            // logic to verify if user exists
            const user = await adapter.getUserByEmail(normalizedEmail);
            console.log('EXISTING USER:', user);
            if (!user) {
              try {
                console.log('CREATING NEW USER...');
                const avatar = gender === 'Female' ? '/avatars/female.jpg' : '/avatars/male.jpg';
                const newUser = await adapter.createUser({
                  emailVerified: null,
                  email: normalizedEmail,
                  name: typeof name === 'string' && name.length > 0 ? name : undefined,
                  image: avatar,
                  gender: typeof gender === 'string' ? gender : undefined,
                  dob: typeof dob === 'string' ? dob : undefined,
                  country: typeof country === 'string' ? country : undefined,
                } as any);
                console.log('NEW USER CREATED:', newUser);
                await adapter.linkAccount({
                  extraData: {
                    password: await bcrypt.hash(password, 10),
                  },
                  type: 'credentials',
                  userId: newUser.id,
                  providerAccountId: String(newUser.id),
                  provider: 'credentials',
                });
                console.log('ACCOUNT LINKED SUCCESSFULLY');
                return newUser;
              } catch (e) {
                console.error('ERROR CREATING USER:', e);
                return null;
              }
            }
            console.log('USER ALREADY EXISTS, RETURNING NULL');
            return null;
          },
        }),
      ],
    }))
  );
}
app.all('/integrations/:path{.+}', async (c, next) => {
  const queryParams = c.req.query();
  const url = `${process.env.NEXT_PUBLIC_CREATE_BASE_URL ?? 'https://www.create.xyz'}/integrations/${c.req.param('path')}${Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : ''}`;

  return proxy(url, {
    method: c.req.method,
    body: c.req.raw.body ?? null,
    // @ts-expect-error -- duplex is accepted by the runtime even though the
    // type declarations don't include it; required for streaming integrations
    duplex: 'half',
    redirect: 'manual',
    headers: {
      ...c.req.header(),
      'X-Forwarded-For': process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-host': process.env.NEXT_PUBLIC_CREATE_HOST,
      Host: process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-project-group-id': process.env.NEXT_PUBLIC_PROJECT_GROUP_ID,
    },
  });
});

app.use('/api/auth/*', async (c, next) => {
  if (isAuthAction(c.req.path)) {
    return authHandler()(c, next);
  }
  return next();
});
app.route(API_BASENAME, api);

export default app;
