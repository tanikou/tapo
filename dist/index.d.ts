/** Declaration file generated by dts-gen */

export interface defaults {
  lightly: boolean
  message: string
  logger: {
    error: (v: string) => void
  }
}

export class Model implements Record<string, unknown> {
  constructor(source?: any)
  [x: string]: unknown

  parse(source?: any): this

  merge(source?: any): this

  recover(source: any): this

  reverse(source?: any): any
}

export interface ModelConfig {
  enumeration?: any[]
  from?: string | undefined
  type?: Function | Function[]
  nullable?: boolean
  format?: (v: any, source: Record<string, unknown>) => any
  to?: string | undefined
  reverse?: (v: any, source: Record<string, unknown>) => any
  omit?: boolean
  validator?: (
    value: any,
    source: Record<string, unknown>
  ) => any | Array<(value: any, source: Record<string, unknown>) => any>
}

export interface ReverseOption {
  lightly?: boolean | undefined
  exclusion?: string[]
}

export function Entity(): any;

export function field(config: ModelConfig): any;

export function format(value: (v: any, me: Record<any, any>) => any): any;

export function from(value?: string): any;

export function enumeration(value: any[]): any;

export function type(value: any): any;

export function nullable(value?: boolean): any;

export function validator(value: any): any;

export function to(value?: string): any;

export function reverse(value: (v: any, me: Record<any, any>) => any): any;

export function omit(value?: boolean): any

export function param(...value: any): any

export function setMessageFormat(v: string): void;

export function setLogger(logger: { error: (v: string) => void }): void;
