import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import {
  type BrowseState,
  DEFAULT_BROWSE_STATE,
  decodeBrowseState,
  encodeBrowseState,
} from "../browse/browseUrlState";
import { MicrovizBrowse } from "../browse/MicrovizBrowse";

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
    () => decodeBrowseState(encoded) ?? DEFAULT_BROWSE_STATE,
    [encoded],
  );

  const onUrlStateChange = useCallback(
    (nextState: BrowseState) => {
      const nextEncoded = encodeBrowseState(nextState) || undefined;
      if (nextEncoded === search.state) return;

      void navigate({
        replace: true,
        search: (prev) => ({ ...prev, state: nextEncoded }),
      });
    },
    [navigate, search.state],
  );

  return (
    <MicrovizBrowse onUrlStateChange={onUrlStateChange} urlState={urlState} />
  );
}
