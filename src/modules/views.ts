import type { JSX } from "react";

import { learningViews } from "./learning/pages";

type SearchParams = Record<string, string | string[] | undefined>;

/** Server-rendered pages of modules that are built. Modules missing here show "Coming soon". */
export type ModuleViews = {
  pages: Record<string, (props: { searchParams: SearchParams }) => Promise<JSX.Element>>;
  detail: Record<string, (props: { id: string; searchParams: SearchParams }) => Promise<JSX.Element>>;
  /** Extra card on the area page. */
  Overview?: () => Promise<JSX.Element>;
};

export const moduleViews: Record<string, ModuleViews> = {
  learning: learningViews,
};
