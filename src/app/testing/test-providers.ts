import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { EnvVars } from '~/app/models/envvars';
import { EnvironmentService } from '@services/environment.service';

// What main.ts provides at bootstrap, for specs that create components backed by the real
// services. EnvironmentService is stubbed because main.ts loads its config in an
// APP_INITIALIZER, which TestBed never runs.
export const testProviders = [
  provideHttpClient(),
  provideHttpClientTesting(),
  provideRouter([]),
  provideNoopAnimations(),
  { provide: EnvironmentService, useValue: { getEnvConfig: () => ({} as EnvVars) } },
];
