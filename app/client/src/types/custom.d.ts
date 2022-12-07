declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;

  const src: string;
  export default src;
}

// This extends the `Array.isArray` function so that
// readonly arrays are properly narrowed

// Columns that share values with those in the `domainValues` object
type AliasedField =
  | 'associatedActionAgency'
  | 'associatedActionStatus'
  | 'parameter'
  | 'parameterName'
  | 'parameterStateIrCategory'
  | 'useStateIrCategory';

type AliasedOptions = {
  [key in AliasedField]: Array<Option<string, string>> | undefined;
};

interface ArrayConstructor {
  isArray(arg: unknown): arg is unknown[] | readonly unknown[];
}

// Fields provided in the `domainValues` of the Content context
type ConcreteField =
  | 'actionAgency'
  | 'assessmentTypes'
  | 'assessmentUnitStatus'
  | 'associatedActionType'
  | 'delistedReason'
  | 'loadAllocationUnits'
  | 'locationTypeCode'
  | 'organizationId'
  | 'parameterGroup'
  | 'pollutant'
  | 'sourceName'
  | 'sourceScale'
  | 'sourceType'
  | 'state'
  | 'stateIrCategory'
  | 'useClassName'
  | 'useName'
  | 'waterSizeUnits'
  | 'waterType';

type ConcreteOptions = {
  [key in ConcreteField]: Array<Option<string, string>>;
};

type DomainOptions = ConcreteOptions & AliasedOptions;

type Option<S, T> = {
  label: S;
  value: T;
};

type DomainValues = {
  actionAgency: Array<Option<string, string>>;
  assessmentUnitStatus: Array<Option<string, string>>;
  loadAllocationUnits: Array<Option<string, string>>;
  locationTypeCode: Array<Option<string, string>>;
  locationText: Array<Option<string, string>>;
  organizationId: Array<Option<string, string>>;
  parameterGroup: Array<Option<string, string>>;
  pollutant: Array<Option<string, string>>;
  sourceName: Array<Option<string, string>>;
  sourceScale: Array<Option<string, string>>;
  sourceType: Array<Option<string, string>>;
  state: Array<Option<string, string>>;
  stateIrCategory: Array<Option<string, string>>;
  useClassName: Array<Option<string, string>>;
  waterSizeUnits: Array<Option<string, string>>;
  waterType: Array<Option<string, string>>;
};
