import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('access_token');

    if (token) {
      console.log(
        `🔐 Interceptor: Adding auth token to ${req.method} ${req.url}`,
      );
      const clonedReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });
      return next(clonedReq);
    } else {
      console.log(
        `⚠️ Interceptor: No token found for ${req.method} ${req.url}`,
      );
    }
  }

  return next(req);
};
