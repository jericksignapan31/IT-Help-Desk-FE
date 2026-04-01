import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'tickets/edit/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'assets/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'employees/edit/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'brands/edit/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
