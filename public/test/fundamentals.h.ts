declare interface EventListenersMap<ScopesMap extends { [event: string]: any }> {
  drop: (scope: ScopesMap["drop"]) => void;
};