declare module '*.svg' {
  import * as React from 'react';
  const SVGComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  export default SVGComponent;
}

declare module "*.png" {
  const value: string;
  export default value;
}
