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
  | 'associatedActionAgency'
  | 'associatedActionStatus'
  | 'associatedActionType'
  | 'parameter'
  | 'pollutant';

export type AliasedOptions = {
  [key in AliasedField]: Array<Option>;
};

// Fields provided in the `domainValues` of the Content context
export type ConcreteField =
  | 'actionAgency'
  | 'actionType'
  | 'assessmentTypes'
  | 'assessmentUnitStatus'
  | 'delistedReason'
  | 'locationTypeCode'
  | 'organizationId'
  | 'parameterGroup'
  | 'parameterName'
  | 'parameterStatus'
  | 'sourceName'
  | 'sourceType'
  | 'state'
  | 'stateIrCategory'
  | 'useClassName'
  | 'useName'
  | 'useSupport'
  | 'waterType';

type ConcreteOptions = {
  [key in ConcreteField]: Array<Option>;
};

export type DomainOptions = ConcreteOptions & Partial<AliasedOptions>;

type EmptyStatus = Exclude<Status, 'success'>;

type FetchEmptyState = {
  status: EmptyStatus;
  data: null;
};

export type FetchState<Type> = FetchEmptyState | FetchSuccessState<Type>;

type FetchSuccessState<Type> = {
  status: 'success';
  data: Type;
};

export type Option = {
  description?: ReactNode;
  label: ReactNode;
  value: Primitive;
};

export type Primitive = string | number | boolean;

export type Status = 'idle' | 'pending' | 'failure' | 'success';
