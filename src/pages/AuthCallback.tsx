import { useEffect } from 'react';
import { client } from '@/lib/api';

export default function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // The backend OIDC callback redirects to:
        // /auth/callback?token=<BACKEND_JWT>&expires_at=<ts>&token_type=Bearer
        //
        // client.auth.login() reads `token` from URL params, stores it as
        // localStorage.token, then redirects to '/'.
        // The SDK axios instance automatically reads localStorage.token and
        // includes it as Authorization: Bearer for ALL requests.
        // No second exchange is needed.
        console.log('[AuthCallback] Calling client.auth.login() → will store token and redirect to /');
        await client.auth.login();

        // Fallback redirect (in case login() doesn't redirect)
        window.location.href = '/';
      } catch (error) {
        console.error('[AuthCallback] Auth callback error:', error);
        window.location.href = '/';
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}