"use client";

import { useSyncExternalStore } from "react";

import { todayIso } from "./defaults";

// Today never changes underneath us within a session, so there is nothing to
// subscribe to; the store exists only to give render a client-vs-server value.
const subscribe = () => () => {};
const getServerSnapshot = () => "";

/**
 * Today's date as `yyyy-mm-dd` in the viewer's timezone, or `""` while
 * prerendering.
 *
 * The page is a static prerender, so reading the clock during render would
 * bake the build date into the HTML and then mismatch on hydration. Going
 * through `useSyncExternalStore` lets the server and client snapshots differ
 * legitimately, without a `setState` in an effect.
 */
export function useToday(): string {
  return useSyncExternalStore(subscribe, todayIso, getServerSnapshot);
}
