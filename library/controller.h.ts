declare type RHParams = Parameters<import("express").RequestHandler>;

declare type RequestHandlers<T extends string> = {
  [endPoint: string]: (
    params: {
      request: RHParams[0];
      response: RHParams[1];
      next: RHParams[2];
    },
    options: {
      setFailureCode(code: number): void;
      logger: import("./logger").default<T>;
    }
  ) => void;
};

declare type isMethodDefined<T> = {} extends T ? never : T;