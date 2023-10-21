interface CustomElementInterface<A, R>{
  new(args: A): HTMLElement & {
    readonly elements: {
      [id: string]: HTMLElement
    },
    readonly returns: R
  };
};

interface UIComponentImportMap{
  "../components/combo-box": {
    elementType: HTMLDivElement,
    components: {
      picture: UIComponent<HTMLImageElement, {}>,
      fbButton: UIComponent<HTMLButtonElement, {}>,
      igButton: UIComponent<HTMLButtonElement, {}>
    },
    args: { fullname: string, username: string },
    returns: {
      addOptions: (options: { id: string; value: string }[]) => void;
      removeOption: (optionId: string) => void;
    }
  };
};