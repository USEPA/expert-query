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
  [key in AliasedField]: Array<Option> | undefined;
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
  [key in ConcreteField]: Array<Option>;
};

type DomainOptions = ConcreteOptions & AliasedOptions;

type Option = {
  context?: string;
  description?: ReactNode;
  label: ReactNode;
  value: Primitive;
};

type Primitive = string | number | boolean;
