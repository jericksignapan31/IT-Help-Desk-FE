import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

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
      return next(clonedReq).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`❌ HTTP Error: ${error.status} ${error.statusText}`, error);

          if (error.status === 401) {
            // Token expired
            localStorage.removeItem('access_token');
            console.warn('⚠️ Auth token expired, user should re-login');
          }

          return throwError(() => error);
        })
      );
    } else {
      console.log(
        `⚠️ Interceptor: No token found for ${req.method} ${req.url}`,
      );
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`❌ HTTP Error: ${error.status} ${error.statusText}`, error);
      return throwError(() => error);
    })
  );
};
