import app from '../../__create/index';

export const loader = async ({ request }) => {
  return app.fetch(request);
};

export const action = async ({ request }) => {
  return app.fetch(request);
};
