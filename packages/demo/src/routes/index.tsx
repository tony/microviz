import { createFileRoute } from "@tanstack/react-router";
import { MicrovizPlayground } from "../playground/MicrovizPlayground";

export const Route = createFileRoute("/")({
  component: IndexComponent,
});

function IndexComponent() {
  return <MicrovizPlayground />;
}
