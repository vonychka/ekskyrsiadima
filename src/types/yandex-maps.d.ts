declare namespace ymaps {
  function ready(callback: () => void): void;

  class Map {
    constructor(element: string | HTMLElement, state: any);
    controls: {
      add(control: any, options?: any): void;
    };
    geoObjects: {
      add(geoObject: any): void;
    };
  }

  class Placemark {
    constructor(coordinates: [number, number], properties: any, options: any);
  }

  namespace panel {
    class Review {
      constructor(manager: any);
      static Manager: new (options: any) => any;
    }
  }

  namespace control {
    class ZoomControl {
      constructor(parameters: any);
    }
  }
}

declare global {
  interface Window {
    ymaps: typeof ymaps;
    initYandexMap: () => void;
  }
}

export {};
