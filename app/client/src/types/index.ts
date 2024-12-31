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
  | 'associatedActionType'
  | 'pollutant';

export type AliasedOptions = {
  [key in AliasedField]: Array<Option>;
};

type BaseFilterFieldConfig = {
  default?: Option;
  contextFields?: string[];
  direction?: 'asc' | 'desc';
  key: string;
  label: string;
  secondaryKey?: string;
  source?: string;
  type: 'date' | 'multiselect' | 'select' | 'text' | 'year';
  size?: 'small' | 'medium' | 'large';
};

// Fields provided in the `domainValues` of the Content context
export type ConcreteField =
  | 'actionAgency'
  | 'actionType'
  | 'assessmentTypes'
  | 'assessmentUnitStatus'
  | 'associatedActionStatus'
  | 'delistedReason'
  | 'documentType'
  | 'locationTypeCode'
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
  data: null | Record<string, never>;
};

export type FetchState<Type> = FetchEmptyState | FetchSuccessState<Type>;

type FetchSuccessState<Type> = {
  status: 'success';
  data: Type;
};

export type MultiOptionField = BaseFilterFieldConfig & {
  type: 'multiselect';
};

export type Option = {
  description?: ReactNode;
  label: ReactNode;
  value: Value;
};

export type QueryData = {
  columns: string[];
  filters: {
    [field: string]: Value | Value[];
  };
  options: {
    [field: string]: Value;
  };
};

export type SingleOptionField = BaseFilterFieldConfig & {
  type: 'select';
};

export type SingleValueField = SingleValueTextField | SingleValueRangeField;

export type SingleValueTextField = BaseFilterFieldConfig & {
  type: 'text';
};

export type SingleValueRangeField = BaseFilterFieldConfig & {
  boundary: 'low' | 'high';
  domain: string;
  type: 'date' | 'year';
};

export type StaticOptions = { [key: string]: Option[] };

export type Status = 'idle' | 'pending' | 'failure' | 'success';

export type Value = string | number;
