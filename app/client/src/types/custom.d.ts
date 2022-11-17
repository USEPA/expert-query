declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;

  const src: string;
  export default src;
}

interface ArrayConstructor {
  isArray(arg: unknown): arg is unknown[] | readonly unknown[];
}

interface Option<S, T> {
  label: S;
  value: T;
}

interface DomainValues {
  actionAgency: Option<string, string>[];
  assessmentUnitStatus: Option<string, string>[];
  loadAllocationUnits: Option<string, string>[];
  locationTypeCode: Option<string, string>[];
  locationText: Option<string, string>[];
  organizationId: Option<string, string>[];
  parameterGroup: Option<string, string>[];
  pollutant: Option<string, string>[];
  sourceName: Option<string, string>[];
  sourceScale: Option<string, string>[];
  sourceType: Option<string, string>[];
  state: Option<string, string>[];
  stateIRCategory: Option<string, string>[];
  useClassName: Option<string, string>[];
  waterSizeUnits: Option<string, string>[];
  waterType: Option<string, string>[];
}
