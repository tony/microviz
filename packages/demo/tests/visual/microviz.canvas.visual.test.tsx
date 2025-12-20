import { computeModel, normalizeSlices } from "@microviz/core";
import { MicrovizCanvas } from "@microviz/react";
import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { applyNoiseDisplacementOverlay } from "../../src/modelOverlays";
import { aggregate, DEMO_DISTRIBUTION } from "../../src/react";

test("microviz canvas fixtures render (visual)", async () => {
  const pipelineModel = computeModel({
    data: DEMO_DISTRIBUTION,
    size: { height: 32, width: 200 },
    spec: { type: "pipeline" },
  });

  const noiseModel = applyNoiseDisplacementOverlay(
    computeModel({
      data: DEMO_DISTRIBUTION,
      size: { height: 32, width: 200 },
      spec: { type: "stacked-bar" },
    }),
  );

  const slices = normalizeSlices(aggregate.DEMO_SLICES);

  const nanoSegments = [...slices]
    .sort((a, b) => b.percentage - a.percentage || a.name.localeCompare(b.name))
    .map((slice) => ({
      color: slice.color,
      name: slice.name,
      pct: slice.percentage,
    }));

  const segmentedSegments = slices.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const concentricSegments = slices
    .slice(0, 4)
    .map((slice) => ({
      color: slice.color,
      name: slice.name,
      pct: slice.percentage,
    }))
    .reverse();

  const nanoModel = computeModel({
    data: nanoSegments,
    size: { height: 32, width: 32 },
    spec: { gapSize: 2, pad: 0, strokeWidth: 4, type: "nano-ring" },
  });

  const segmentedModel = computeModel({
    data: segmentedSegments,
    size: { height: 32, width: 32 },
    spec: { type: "segmented-ring" },
  });

  const concentricModel = computeModel({
    data: concentricSegments,
    size: { height: 32, width: 32 },
    spec: { ringGap: 1, rings: 4, strokeWidth: 2.5, type: "concentric-arcs" },
  });

  render(
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">
          microviz canvas visual fixtures
        </h1>
        <p className="text-sm text-slate-600">
          A small set of charts rendered via MicrovizCanvas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          className="inline-flex flex-col gap-2"
          data-testid="pipeline-canvas"
        >
          <div className="text-xs text-slate-600">Pipeline (Canvas)</div>
          <MicrovizCanvas className="h-8 w-[200px]" model={pipelineModel} />
        </div>

        <div
          className="inline-flex flex-col gap-2"
          data-testid="noise-displacement-canvas"
        >
          <div className="text-xs text-slate-600">
            Noise displacement (Canvas)
          </div>
          <MicrovizCanvas
            className="h-8 w-[200px] overflow-hidden rounded"
            model={noiseModel}
          />
        </div>
      </div>

      <div className="mt-10 flex items-center gap-6" data-testid="rings-canvas">
        <MicrovizCanvas className="h-8 w-8" model={nanoModel} />
        <MicrovizCanvas className="h-8 w-8" model={segmentedModel} />
        <MicrovizCanvas className="h-8 w-8" model={concentricModel} />
      </div>
    </div>,
  );

  await document.fonts.ready;

  await expect(page.getByTestId("pipeline-canvas")).toMatchScreenshot(
    "pipeline-canvas",
  );
  await expect(page.getByTestId("noise-displacement-canvas")).toMatchScreenshot(
    "noise-displacement-canvas",
  );
  await expect(page.getByTestId("rings-canvas")).toMatchScreenshot(
    "rings-canvas",
  );
});
