/** Represents a nullable value */
export type Nullable<T> = T | null;

/** Represents a potentially absent value */
export type Maybe<T> = T | null | undefined;

/** Deep partial — makes all nested properties optional */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Extract keys of T whose values are of type V */
export type KeysOfType<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];
