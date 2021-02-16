declare module "*.svg" {
    import { FunctionComponent, SVGProps } from "react";

    export const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
    const src: string;
    export default src;
}

declare module "*.jpg" {
    const content: string;
    export default content;
}

declare module "*.png" {
    const content: string;
    export default content;
}

declare module "*.json" {
    const content: string;
    export default content;
}
