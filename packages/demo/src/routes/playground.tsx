import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { CdnPlayground } from "../cdn-playground/CdnPlayground";
import {
  type CdnPlaygroundState,
  DEFAULT_CDN_PLAYGROUND_STATE,
  decodeCdnPlaygroundState,
  encodeCdnPlaygroundState,
} from "../cdn-playground/cdnPlaygroundState";

export const Route = createFileRoute("/playground")({
  validateSearch: (search: Record<string, unknown>): { state?: string } => {
    return {
      state: typeof search.state === "string" ? search.state : undefined,
    };
  },
  component: PlaygroundComponent,
});

function PlaygroundComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const encoded = search.state ?? "";
  const urlState = useMemo(
    () => decodeCdnPlaygroundState(encoded) ?? DEFAULT_CDN_PLAYGROUND_STATE,
    [encoded],
  );

  const onUrlStateChange = useCallback(
    (nextState: CdnPlaygroundState) => {
      const nextEncoded = encodeCdnPlaygroundState(nextState) || undefined;
      if (nextEncoded === search.state) return;

      void navigate({
        replace: true,
        search: (prev) => ({ ...prev, state: nextEncoded }),
      });
    },
    [navigate, search.state],
  );

  return (
    <CdnPlayground onUrlStateChange={onUrlStateChange} urlState={urlState} />
  );
}
