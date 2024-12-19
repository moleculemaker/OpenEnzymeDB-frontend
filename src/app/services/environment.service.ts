import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { EnvVars } from "../models/envvars";
import { Configuration as MmliBackendConfiguration } from "../api/mmli-backend/v1";
import { Configuration as MoldbConfiguration } from "../api/moldb/v1";

@Injectable()
export class EnvironmentService {
  private envConfig: EnvVars;

  constructor(
    private readonly http: HttpClient,
    private apiConfig: MmliBackendConfiguration,
    private molDBApiConfig: MoldbConfiguration
  ) {}

  async loadEnvConfig(configPath: string): Promise<void> {
    console.log('Loading environment config!');
    this.envConfig = await lastValueFrom(this.http.get<EnvVars>(configPath));
    this.apiConfig.basePath = this.envConfig.hostname + this.envConfig.basePath
    this.molDBApiConfig.basePath = this.envConfig.molDBHostname + this.envConfig.molDBBasePath
  }

  getEnvConfig(): EnvVars {
    return this.envConfig;
  }
}
