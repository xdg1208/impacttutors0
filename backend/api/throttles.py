from rest_framework.throttling import SimpleRateThrottle

class PasswordResetThrottle(SimpleRateThrottle):
    scope = 'password_reset'

    def get_cache_key(self, request, view):
        # Throttle by IP for anonymous requests, and by user email when provided
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            # Use IP address
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR')
            ident = ip
        if not ident:
            return None
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }
