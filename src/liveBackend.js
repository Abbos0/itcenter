const resolveDefaultBackendUrl = () => {
  if (process.env.REACT_APP_LIVE_BACKEND_URL) {
    return process.env.REACT_APP_LIVE_BACKEND_URL;
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:4000';
  }

  const { hostname, origin } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }

  return `${origin}/_/backend`;
};

export const LIVE_BACKEND_URL = resolveDefaultBackendUrl();
