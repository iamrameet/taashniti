/// <reference path="nav-route.h.ts"/>
import Listeners from "./listeners.js";

/**
 * @template {FlattenObjectKeys<NavRouter>} K
 * @typedef {{ render: (path: K, element: HTMLElement) => void; unrender: (path: K, element: HTMLElement) => void }} NavRouterEventsMap */

/**
 * @template {NavRoutes} T
 * @template {FlattenObjectKeys<T>} K
 */
export default class NavRouter {

  /** @type {SubRoutes<T>} */
  #routes = {};
  /** @type {keyof T} */
  #selectedPath = "";

  /** @type {Listeners<NavRouterEventsMap<K>>} */
  #Listeners = new Listeners([ "render", "unrender" ]);

  /**
   * @param {T} routes
   */
  constructor(routes){

    if("/*" in routes === false){
      throw "route '/*' must be specified";
    }
    const flatRoutes = NavRouter.#flatRoutes(routes);
    for(const path in flatRoutes){
      const element = flatRoutes[path];
      const placeholder = new Comment("placeholder for " + element);
      element.parentElement.replaceChild(placeholder, element);
      this.#routes[path] = { placeholder, element };
    }

    window.addEventListener("popstate", () => {
      const { pathname } = window.location;
      this.#render(pathname);
    });

    this.push(window.location.pathname);

  }

  /** @param {NavRoutes} routes */
  static #flatRoutes(routes){
    /** @type {{ [K: string ]: HTMLElement }} */
    const object = {};
    for(const path in routes){
      const nestedRoutes = this.#flatRouteSubPaths(routes[path], path);
      object[path] = routes[path].element;
      Object.assign(object, nestedRoutes);
    }
    return object;
  }

  /** @param {NavRoute} route */
  static #flatRouteSubPaths(route, path = "/"){
    /** @type {{ [key: K]: Element }} */
    let paths = {};
    if("subRoutes" in route){
      for(const subPath in route.subRoutes){
        const currentPath = path + subPath;
        paths[currentPath] = route.subRoutes[subPath].element;
        paths = {
          ...paths,
          ...NavRouter.#flatRouteSubPaths(route.subRoutes[subPath], currentPath)
        };
      }
    }
    return paths;
  }

  /** @param {K} path */
  #render(path){
    if(path in this.#routes === false){
      path = "/*";
    }
    const { added, removed } = NavRouter.#comparePaths(this.#selectedPath, path);
    this.#unrender(removed);
    // if(!this.#isInSelectedPath(path)){
    // }
    for(const routePath of added){
      // if(routePath in this.#routes === false){
      //   console.warn(`route '${ routePath }' not initialised`);
      //   break;
      // }
      const { element, placeholder } = this.#routes[routePath];
      placeholder.parentElement?.replaceChild(element, placeholder);
      this.#Listeners.trigger("render", routePath, element);
    }
    this.#selectedPath = path;
  }

  /** @param {K} path */
  #isInSelectedPath(path){
    return this.#selectedPath !== null && this.#selectedPath.indexOf(path) === 0;
  }

  /** @param {string[]} paths */
  #unrender(paths){
    for(const path of paths){
      // if(path in this.#routes === false){
      //   break;
      // }
      const { element, placeholder } = this.#routes[path];
      this.#Listeners.trigger("unrender", path, element);
      element.parentElement?.replaceChild(placeholder, element);
    }
  }

  /**
   * @param {string} oldPath
   * @param {string} newPath
   */
  static #comparePaths(oldPath, newPath) {
    const oldSegments = oldPath.split("/");
    const newSegments = newPath.split("/");

    const addedSegments = [];
    const removedSegments = [];
    const unchangedSegments = [];

    let i = 0;
    while (i < oldSegments.length && i < newSegments.length) {
      if (oldSegments[i] !== newSegments[i]) {
        break;
      }
      unchangedSegments.push(oldSegments[i]);
      i++;
    }

    removedSegments.push(...oldSegments.slice(i));
    addedSegments.push(...newSegments.slice(i));

    const prefix = unchangedSegments.join("/");

    return {
      added: NavRouter.#combineSegments(addedSegments, prefix),
      removed: NavRouter.#combineSegments(removedSegments, prefix),
      unchanged: unchangedSegments
    };
  }

  /**
   * @param {string[]} segments
   * @param {string} prefix
   * @returns {string[]}
  */
  static #combineSegments(segments, prefix){
    return segments.reduce((result, segment) => {
      const cumulativePath = result.length > 0
        ? `${ result[result.length - 1] }/${ segment }`
        : `${ prefix }/${ segment }`;
        return [ ...result, cumulativePath ];
    }, []);
  }

  /** @type {Listeners<NavRouterEventsMap<K>>["on"]} */
  on(eventName, handler){
    this.#Listeners.on(eventName, handler);
  }

  /**
   * @template {K} P
   * @param {P} path */
  push(path, data = null){
    window.history.pushState(data, "", path);
    this.#render(path);
  }

  back(){
    window.history.back();
  }

  forward(){
    window.history.forward();
  }
};