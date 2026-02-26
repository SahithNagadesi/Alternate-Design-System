export interface ApplicationMetadata {
  frontendFramework: string;
  frontendFrameworkOther?: string;
  pegaAppName: string;
  caseTypes: string;
  dxApiVersion: string;
  dxApiAuthMethod: string;
  dxApiEndpoints?: string;
}

export interface ComponentMetadata {
  organizationName: string;
  libraryName: string;
  componentName: string;
  componentVersion: string;
  projectDescription?: string;

  componentType: string;
  componentSubtype: string;

  dxcbVersion: string;
  pegaPlatformVersion: string;
  libraryMode: boolean;

  rulesetName?: string;
  rulesetVersion?: string;
  oauthGrantType?: string;
  clientId?: string;
}

export interface PegaCredentials {
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
}
