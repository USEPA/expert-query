import type { ReactNode } from 'react';

declare global {
  // This extends the `Array.isArray` function so that
  // readonly arrays are properly narrowed
  interface ArrayConstructor {
    isArray(arg: unknown): arg is unknown[] | readonly unknown[];
  }
}

// Columns that share values with those in the `domainValues` object
export type AliasedField =
  | 'assessmentUnitState'
  | 'associatedActionAgency'
  | 'associatedActionStatus'
  | 'parameter'
  | 'parameterName'
  | 'parameterStateIrCategory'
  | 'useStateIrCategory';

export type AliasedOptions = {
  [key in AliasedField]: Array<Option>;
};

// Fields provided in the `domainValues` of the Content context
export type ConcreteField =
  | 'actionAgency'
  | 'assessmentTypes'
  | 'assessmentUnitStatus'
  | 'associatedActionType'
  | 'delistedReason'
  | 'locationTypeCode'
  | 'organizationId'
  | 'parameterGroup'
  | 'pollutant'
  | 'sourceName'
  | 'sourceType'
  | 'state'
  | 'stateIrCategory'
  | 'useClassName'
  | 'useName'
  | 'waterType';

export type ConcreteOptions = {
  [key in ConcreteField]: Array<Option>;
};

export type DomainOptions = ConcreteOptions & Partial<AliasedOptions>;

export type Option = {
  context?: string;
  description?: ReactNode;
  label: ReactNode;
  value: Primitive;
};

export type PostData = {
  filters: {
    [field: string]: Primitive | Primitive[];
  };
  options: {
    [field: string]: string;
  };
};

export type Primitive = string | number | boolean;

export type SortDirection = 'asc' | 'desc';

export type Status = 'idle' | 'pending' | 'failure' | 'success';
