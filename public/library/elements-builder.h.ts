type ElementsBuilderProperties<T extends HTMLElement> = {
  [P in keyof T as T[P] extends (...args: any) => any
    ? Parameters<T[P]>["length"] extends 0
      ? never : P
    : P
  ]?: T[P] extends (...args: infer Args) => any
    ? Parameters<T[P]>["length"] extends 1
      ? Parameters<T[P]>[0] | Parameters<T[P]> : Args
    : T[P];
} & {
  $listeners?: ListenerCollection<T>;
  $attributes?: { [attribute: string]: string };
  $parentElement?: HTMLElement;
  $styles?: ElementsBuilderStyles;
};

type BuilderElementType<T extends HTMLElement> = {
  new(properties?: ElementsBuilderProperties<T>, options?: ElementCreationOptions): T;
  create(properties: ElementsBuilderProperties<T>): T;
}

type ExtendedBuilderElementType<T extends HTMLElement, A extends any[]> = {
  new(...args: A): T;
  create(...args: A): T;
}

type ListenerCollection<T> = {
  [K in keyof HTMLElementEventMap]?: (this: T, event: HTMLElementEventMap[K]) => void;
};

type ElementsBuilderStyles = Partial<CSSStyleDeclaration> & { properties?: { [property: string]: string | null | [ string | null, string | undefined ] } };

type ExtendedBuilderElementOptions<T extends HTMLElement, C extends []> = {
  properties?: ElementsBuilderProperties<T>;
  creationOptions?: ElementCreationOptions;
  constructor?: (...args: C) => ExtendedBuilderElementReturnType<T>;
};

type ExtendedBuilderElementConstructor<T extends HTMLElement> = () => ExtendedBuilderElementReturnType<T>;

type ExtendedBuilderElementReturnType<T extends HTMLElement> = [
  properties?: ElementsBuilderProperties<T>,
  options?: ElementCreationOptions
] | undefined;