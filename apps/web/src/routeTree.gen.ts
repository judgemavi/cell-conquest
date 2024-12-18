/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from "@tanstack/react-router";

// Import Routes

import { Route as rootRoute } from "./routes/__root";
import { Route as LayoutImport } from "./routes/_layout";

// Create Virtual Routes

const LayoutIndexLazyImport = createFileRoute("/_layout/")();
const LayoutSandboxLazyImport = createFileRoute("/_layout/sandbox")();
const LayoutRulesLazyImport = createFileRoute("/_layout/rules")();

// Create/Update Routes

const LayoutRoute = LayoutImport.update({
  id: "/_layout",
  getParentRoute: () => rootRoute,
} as any);

const LayoutIndexLazyRoute = LayoutIndexLazyImport.update({
  path: "/",
  getParentRoute: () => LayoutRoute,
} as any).lazy(() =>
  import("./routes/_layout/index.lazy").then((d) => d.Route),
);

const LayoutSandboxLazyRoute = LayoutSandboxLazyImport.update({
  path: "/sandbox",
  getParentRoute: () => LayoutRoute,
} as any).lazy(() =>
  import("./routes/_layout/sandbox.lazy").then((d) => d.Route),
);

const LayoutRulesLazyRoute = LayoutRulesLazyImport.update({
  path: "/rules",
  getParentRoute: () => LayoutRoute,
} as any).lazy(() =>
  import("./routes/_layout/rules.lazy").then((d) => d.Route),
);

// Populate the FileRoutesByPath interface

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/_layout": {
      id: "/_layout";
      path: "";
      fullPath: "";
      preLoaderRoute: typeof LayoutImport;
      parentRoute: typeof rootRoute;
    };
    "/_layout/rules": {
      id: "/_layout/rules";
      path: "/rules";
      fullPath: "/rules";
      preLoaderRoute: typeof LayoutRulesLazyImport;
      parentRoute: typeof LayoutImport;
    };
    "/_layout/sandbox": {
      id: "/_layout/sandbox";
      path: "/sandbox";
      fullPath: "/sandbox";
      preLoaderRoute: typeof LayoutSandboxLazyImport;
      parentRoute: typeof LayoutImport;
    };
    "/_layout/": {
      id: "/_layout/";
      path: "/";
      fullPath: "/";
      preLoaderRoute: typeof LayoutIndexLazyImport;
      parentRoute: typeof LayoutImport;
    };
  }
}

// Create and export the route tree

interface LayoutRouteChildren {
  LayoutRulesLazyRoute: typeof LayoutRulesLazyRoute;
  LayoutSandboxLazyRoute: typeof LayoutSandboxLazyRoute;
  LayoutIndexLazyRoute: typeof LayoutIndexLazyRoute;
}

const LayoutRouteChildren: LayoutRouteChildren = {
  LayoutRulesLazyRoute: LayoutRulesLazyRoute,
  LayoutSandboxLazyRoute: LayoutSandboxLazyRoute,
  LayoutIndexLazyRoute: LayoutIndexLazyRoute,
};

const LayoutRouteWithChildren =
  LayoutRoute._addFileChildren(LayoutRouteChildren);

export interface FileRoutesByFullPath {
  "": typeof LayoutRouteWithChildren;
  "/rules": typeof LayoutRulesLazyRoute;
  "/sandbox": typeof LayoutSandboxLazyRoute;
  "/": typeof LayoutIndexLazyRoute;
}

export interface FileRoutesByTo {
  "/rules": typeof LayoutRulesLazyRoute;
  "/sandbox": typeof LayoutSandboxLazyRoute;
  "/": typeof LayoutIndexLazyRoute;
}

export interface FileRoutesById {
  __root__: typeof rootRoute;
  "/_layout": typeof LayoutRouteWithChildren;
  "/_layout/rules": typeof LayoutRulesLazyRoute;
  "/_layout/sandbox": typeof LayoutSandboxLazyRoute;
  "/_layout/": typeof LayoutIndexLazyRoute;
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath;
  fullPaths: "" | "/rules" | "/sandbox" | "/";
  fileRoutesByTo: FileRoutesByTo;
  to: "/rules" | "/sandbox" | "/";
  id:
    | "__root__"
    | "/_layout"
    | "/_layout/rules"
    | "/_layout/sandbox"
    | "/_layout/";
  fileRoutesById: FileRoutesById;
}

export interface RootRouteChildren {
  LayoutRoute: typeof LayoutRouteWithChildren;
}

const rootRouteChildren: RootRouteChildren = {
  LayoutRoute: LayoutRouteWithChildren,
};

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>();

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/_layout"
      ]
    },
    "/_layout": {
      "filePath": "_layout.tsx",
      "children": [
        "/_layout/rules",
        "/_layout/sandbox",
        "/_layout/"
      ]
    },
    "/_layout/rules": {
      "filePath": "_layout/rules.lazy.tsx",
      "parent": "/_layout"
    },
    "/_layout/sandbox": {
      "filePath": "_layout/sandbox.lazy.tsx",
      "parent": "/_layout"
    },
    "/_layout/": {
      "filePath": "_layout/index.lazy.tsx",
      "parent": "/_layout"
    }
  }
}
ROUTE_MANIFEST_END */
