/// <reference types="node" />

import { Transform } from 'node:stream';

declare class Mem {
  constructor(servers?: Mem.Addresses|Mem.Address, options?: Mem.Options);

  static DEFAULT_EXPIRY: Mem.Expiry;
  static setDefaultExpiry(expiry?: Mem.Expiry): void;

  static get(key: Mem.Key): Mem.StaticResult;
  static getk(key: Mem.Key): Mem.StaticResult;
  static gets(key: Mem.Key): Mem.StaticResult;
  static getsv(key: Mem.Key): Mem.StaticResult;
  static set(key: Mem.Key, value: Mem.Value, expiry?: Mem.Expiry): Mem.StaticResult;
  static setk(key: Mem.KeyObject, expiry?: Mem.Expiry): Mem.StaticResult;
  static add(key: Mem.Key, value: Mem.Value, expiry?: Mem.Expiry): Mem.StaticResult;
  static addk(key: Mem.KeyObject, expiry?: Mem.Expiry): Mem.StaticResult;
  static replace(key: Mem.Key, value: Mem.Value, expiry?: Mem.Expiry): Mem.StaticResult;
  static replacek(key: Mem.KeyObject, expiry?: Mem.Expiry): Mem.StaticResult;
  static cas(key: Mem.KeyString, value: Mem.Value, cas: Mem.CAS, expiry?: Mem.Expiry): Mem.StaticResult;
  static del(key: Mem.Key): Mem.StaticResult;
  static incr(key: Mem.Key, initial: BigInt, delta: BigInt, expiry?: Mem.Expiry): Mem.StaticResult;
  static decr(key: Mem.Key, initial: BigInt, delta: BigInt, expiry?: Mem.Expiry): Mem.StaticResult;
  static quit(): Mem.StaticResult;
  static flush(expiry?: Mem.Expiry): Mem.StaticResult;
  static noop(): Mem.StaticResult;
  static version(): Mem.StaticResult;
  static append(key: Mem.Key, value: Mem.ValueString): Mem.StaticResult;
  static appends(key: Mem.Key, value: Mem.ValueString): Mem.StaticResult;
  static appendk(key: Mem.KeyObjectString): Mem.StaticResult;
  static appendks(key: Mem.KeyObjectString): Mem.StaticResult;
  static prepend(key: Mem.Key, value: Mem.ValueString): Mem.StaticResult;
  static prepends(key: Mem.Key, value: Mem.ValueString): Mem.StaticResult;
  static prependk(key: Mem.KeyObjectString): Mem.StaticResult;
  static prependks(key: Mem.KeyObjectString): Mem.StaticResult;
  static stat(key?: Mem.KeyString): Mem.StaticResult;
  static touch(key: Mem.Key, expiry?: Mem.Expiry): Mem.StaticResult;
  static gat(key: Mem.Key, expiry?: Mem.Expiry): Mem.StaticResult;

  get(key: Mem.KeyString): Promise<Mem.Value|null>|Transform;
  get(key: Mem.KeyArray): Promise<Mem.Value[]>|Transform;

  getk(key: Mem.KeyString): Promise<Mem.KeyObject|null>|Transform;
  getk(key: Mem.KeyArray): Promise<Mem.KeyObject>|Transform;

  gets(key: Mem.KeyString): Promise<Mem.CAS|null>|Transform;
  gets(key: Mem.KeyArray): Promise<Mem.KeyObjectCAS>|Transform;

  getsv(key: Mem.KeyString): Promise<Mem.CASValue|null>|Transform;
  getsv(key: Mem.KeyArray): Promise<Mem.KeyObjectCASValue>|Transform;

  set(key: Mem.Key, value: Mem.Value, expiry?: Mem.Expiry): Promise<boolean>|Transform;
  setk(key: Mem.KeyObject, expiry?: Mem.Expiry): Promise<boolean>|Transform;

  add(key: Mem.Key, value: Mem.Value, expiry?: Mem.Expiry): Promise<boolean>|Transform;
  addk(key: Mem.KeyObject, expiry?: Mem.Expiry): Promise<boolean>|Transform;

  replace(key: Mem.Key, value: Mem.Value, expiry?: Mem.Expiry): Promise<boolean>|Transform;
  replacek(key: Mem.KeyObject, expiry?: Mem.Expiry): Promise<boolean>|Transform;

  cas(key: Mem.KeyString, value: Mem.Value, cas: Mem.CAS, expiry?: Mem.Expiry): Promise<boolean>|Transform;

  del(key: Mem.Key): Promise<boolean>|Transform;

  incr(key: Mem.KeyString, initial: BigInt, delta: BigInt, expiry?: Mem.Expiry): Promise<Mem.Value|null>|Transform;
  incr(key: Mem.KeyArray, initial: BigInt, delta: BigInt, expiry?: Mem.Expiry): Promise<Mem.Value[]>|Transform;

  decr(key: Mem.KeyString, initial: BigInt, delta: BigInt, expiry?: Mem.Expiry): Promise<Mem.Value|null>|Transform;
  decr(key: Mem.KeyArray, initial: BigInt, delta: BigInt, expiry?: Mem.Expiry): Promise<Mem.Value[]>|Transform;

  quit(): Promise<null>|Transform;

  flush(expiry?: Mem.Expiry): Promise<null>|Transform;

  noop(): Promise<true>|Transform;

  version(): Promise<Mem.HostnameVersion>|Transform;

  append(key: Mem.Key, value: Mem.ValueString): Promise<boolean>|Transform;
  appends(key: Mem.KeyString, value: Mem.ValueString): Promise<Mem.CAS|null>|Transform;
  appends(key: Mem.KeyArray, value: Mem.ValueString): Promise<Mem.CAS[]>|Transform;
  appendk(key: Mem.KeyObjectString): Promise<boolean>|Transform;
  appendks(key: Mem.KeyObjectString): Promise<Mem.CAS[]>|Transform;

  prepend(key: Mem.Key, value: Mem.ValueString): Promise<boolean>|Transform;
  prepends(key: Mem.KeyString, value: Mem.ValueString): Promise<Mem.CAS|null>|Transform;
  prepends(key: Mem.KeyArray, value: Mem.ValueString): Promise<Mem.CAS[]>|Transform;
  prependk(key: Mem.KeyObjectString): Promise<boolean>|Transform;
  prependks(key: Mem.KeyObjectString): Promise<Mem.CAS[]>|Transform;

  stat(key?: Mem.KeyString): Promise<Mem.HostnameObject>|Transform;
  touch(key: Mem.Key, expiry?: Mem.Expiry): Promise<boolean>|Transform;
  gat(key: Mem.KeyString, expiry?: Mem.Expiry): Promise<Mem.Value|null>|Transform;
  gat(key: Mem.KeyArray, expiry?: Mem.Expiry): Promise<Mem.Value[]>|Transform;

  stream(): Transform;

  end(): void;
}

declare namespace Mem {
  type Address = string;
  type Addresses = Address[];
  type Key = string|string[];
  type KeyString = string|number;
  type KeyArray = string[];
  type Value = string|String|number|BigInt|boolean|Date|any[]|Buffer|object|null;
  type ValueString = string;
  type Expiry = number;
  type CAS = BigInt;
  type StaticResult = any[];

  interface KeyObject {
    [key: KeyString]: Value;
  }

  interface KeyObjectString {
    [key: KeyString]: string;
  }

  interface KeyObjectCAS {
    [key: KeyString]: CAS;
  }

  interface KeyObjectCASValue {
    [key: KeyString]: CASValue;
  }

  interface CASValue {
    value: Value;
    cas: CAS;
  }

  interface HostnameVersion {
    [key: string]: string;
  }

  interface HostnameObject {
    [key: string]: object;
  }

  interface Options {
    stream?: boolean;
    expiry?: number;
    maxConnections?: number;
    connectionTimeout?: number;
    timeout?: number;
    retries?: number;
    retriesDelay?: number;
    retriesFactor?: number;
    maxFailures?: number;
    failoverServers?: Addresses;
    keepAliveInitialDelay?: number;
  }
}

export = Mem;
