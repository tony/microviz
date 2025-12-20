import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { MicrovizPlayground } from "../playground/MicrovizPlayground";
import {
  DEFAULT_PLAYGROUND_STATE,
  decodePlaygroundState,
  encodePlaygroundState,
  type PlaygroundState,
} from "../playground/playgroundUrlState";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { state?: string } => {
    return {
      state: typeof search.state === "string" ? search.state : undefined,
    };
  },
  component: IndexComponent,
});

function IndexComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const encoded = search.state ?? "";
  const urlState = useMemo(
    () => decodePlaygroundState(encoded) ?? DEFAULT_PLAYGROUND_STATE,
    [encoded],
  );

  const onUrlStateChange = useCallback(
    (nextState: PlaygroundState) => {
      const nextEncoded = encodePlaygroundState(nextState) || undefined;
      if (nextEncoded === search.state) return;

      void navigate({
        replace: true,
        search: (prev) => ({ ...prev, state: nextEncoded }),
      });
    },
    [navigate, search.state],
  );

  return (
    <MicrovizPlayground
      onUrlStateChange={onUrlStateChange}
      urlState={urlState}
    />
  );
}
