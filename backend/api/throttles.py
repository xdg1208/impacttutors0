from rest_framework.throttling import SimpleRateThrottle


class TrustedIPThrottle(SimpleRateThrottle):
    """
    Base throttle that identifies clients by the RIGHTMOST entry of
    X-Forwarded-For (appended by our own trusted proxy, e.g. Render),
    falling back to REMOTE_ADDR.

    The leftmost XFF entries are client-controlled and must never be
    trusted for rate limiting — an attacker could otherwise spoof a new
    "identity" per request and bypass the throttle entirely.
    """

    def get_ident(self, request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        if xff:
            return xff.split(',')[-1].strip()
        return request.META.get('REMOTE_ADDR')

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        if not ident:
            return None
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class PasswordResetThrottle(TrustedIPThrottle):
    scope = 'password_reset'


class RegisterThrottle(TrustedIPThrottle):
    scope = 'register'


class AnonSubmitThrottle(TrustedIPThrottle):
    """For public forms: registration codes, applications, contact messages."""
    scope = 'anon_submit'


class LoginThrottle(TrustedIPThrottle):
    """Rate-limits login and token refresh to prevent brute-force attacks."""
    scope = 'login'
