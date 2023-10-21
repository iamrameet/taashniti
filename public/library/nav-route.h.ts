type NavRoute = {
  element: HTMLElement;
  subRoutes?: NavRoutes;
};

type NavRoutes = {
  [path: string]: NavRoute;
};

type SubRoutes<T extends NavRoutes> = {
  [path in keyof T]: SubRoute<
    T[path]["element"],
    T[path]["subRoutes"] extends NavRoutes ? T[path]["subRoutes"] : {}
  >;
};

type SubRoute<E extends HTMLElement, T extends NavRoutes = {}> = {
  element: E;
  placeholder: Comment;
  subRoutes: SubRoutes<T>;
};

type FlattenNavRoutes<T extends NavRoutes, P extends string = ""> = {
  [K in keyof T as T[K]["subRoutes"] extends NavRoutes
    ? keyof FlattenNavRoutes<T[K]["subRoutes"], `${P}${Extract<K, string>}`>
    : `${P}${Extract<K, string>}`
  ]: never
};

type G<N extends NavRoutes, P extends string> = P extends `/${ infer B }/${ infer Rest }`
  ? B extends keyof N
    ? N[B]["subRoutes"] extends NavRoutes
      ? G<N[B]["subRoutes"], `/${ Rest }`>
      : N[B]["element"]
    : G<N, `/${ Rest }`>
  : P;

type FlattenObjectKeys<T extends NavRoutes, K = keyof T> = K extends string
  ? T[K]["subRoutes"] extends NavRoutes
    ? FlattenObjectKeys<T[K]["subRoutes"]> extends infer I
      ? I extends "/"
        ? K
        : `${K}${ FlattenObjectKeys<T[K]["subRoutes"]> }`
      : K
    : K
  : Extract<K, string>;

type H<S extends string> = S extends `/${ infer A }/${ infer B }` ? A : S extends `/${ infer A }` ? A : never;

type h = H<"/abc/ghi">;