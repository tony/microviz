import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { CdnPlayground } from "../cdn-playground/CdnPlayground";
import {
  type CdnPlaygroundState,
  DEFAULT_CDN_PLAYGROUND_STATE,
  decodePlaygroundSearch,
  encodePlaygroundSearch,
  type PlaygroundSearchParams,
} from "../cdn-playground/cdnPlaygroundState";

export const Route = createFileRoute("/playground")({
  validateSearch: (search: Record<string, unknown>): PlaygroundSearchParams => {
    return {
      c: typeof search.c === "string" ? search.c : undefined,
      cdn: typeof search.cdn === "string" ? search.cdn : undefined,
      csp: typeof search.csp === "string" ? search.csp : undefined,
      p: typeof search.p === "string" ? search.p : undefined,
      s: typeof search.s === "string" ? search.s : undefined,
      state: typeof search.state === "string" ? search.state : undefined,
    };
  },
  component: PlaygroundComponent,
});

function PlaygroundComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const urlState = useMemo(
    () => decodePlaygroundSearch(search) ?? DEFAULT_CDN_PLAYGROUND_STATE,
    [search],
  );

  const onUrlStateChange = useCallback(
    (nextState: CdnPlaygroundState) => {
      const nextSearch = encodePlaygroundSearch(nextState);

      void navigate({
        replace: true,
        search: nextSearch,
      });
    },
    [navigate],
  );

  return (
    <CdnPlayground onUrlStateChange={onUrlStateChange} urlState={urlState} />
  );
}
