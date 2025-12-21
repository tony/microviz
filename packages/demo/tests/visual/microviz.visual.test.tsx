import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  ActivityCadence,
  ActivityCadenceDots,
  ActivityCadenceTight,
  aggregate,
  DEMO_DISTRIBUTION,
  DEMO_TIMELINE_MONTHS,
  GradientFade,
  MicroHeatline,
  MosaicBar,
  PerforatedBar,
  PipelineBar,
  PixelGrid,
  RankedDotCascade,
  ShadowDepth,
  SplitRibbon,
  StripeDensity,
  VIZ_CLASS,
  WaveformBars,
} from "../../src/react";

const SERIES: number[] = DEMO_TIMELINE_MONTHS.map((m) => m.count);

test("microviz patterns render (visual)", async () => {
  render(
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">microviz visual fixtures</h1>
        <p className="text-sm text-slate-600">
          A small set of patterns covering CSS, SVG, and grid layouts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className={VIZ_CLASS} data-testid="activity-cadence">
          <ActivityCadence color="#2563eb" series={SERIES} />
        </div>

        <div className={VIZ_CLASS} data-testid="activity-cadence-tight">
          <ActivityCadenceTight color="#2563eb" series={SERIES} />
        </div>

        <div className={VIZ_CLASS} data-testid="activity-cadence-dots">
          <ActivityCadenceDots color="#2563eb" series={SERIES} />
        </div>

        <div className={VIZ_CLASS} data-testid="stripe-density">
          <StripeDensity data={DEMO_DISTRIBUTION} />
        </div>

        <div className={VIZ_CLASS} data-testid="gradient-fade">
          <GradientFade data={DEMO_DISTRIBUTION} />
        </div>

        <div className={VIZ_CLASS} data-testid="perforated">
          <PerforatedBar data={DEMO_DISTRIBUTION} />
        </div>

        <div className={VIZ_CLASS} data-testid="shadow-depth">
          <ShadowDepth data={DEMO_DISTRIBUTION} />
        </div>

        <div className={VIZ_CLASS} data-testid="pixel-grid">
          <PixelGrid data={DEMO_DISTRIBUTION} />
        </div>

        <div className={VIZ_CLASS} data-testid="waveform">
          <WaveformBars series={SERIES} />
        </div>

        <div className={VIZ_CLASS} data-testid="dot-cascade">
          <RankedDotCascade data={DEMO_DISTRIBUTION} />
        </div>

        <div className={VIZ_CLASS} data-testid="mosaic">
          <MosaicBar data={DEMO_DISTRIBUTION} />
        </div>

        <div className={VIZ_CLASS} data-testid="split-ribbon">
          <SplitRibbon data={DEMO_DISTRIBUTION} />
        </div>

        <div className={VIZ_CLASS} data-testid="micro-heatline">
          <MicroHeatline data={DEMO_DISTRIBUTION} />
        </div>

        <div className={VIZ_CLASS} data-testid="pipeline">
          <PipelineBar data={DEMO_DISTRIBUTION} />
        </div>
      </div>

      <div className="mt-10 flex items-center gap-6" data-testid="rings">
        <div className="flex items-center justify-center">
          <aggregate.NanoRing slices={aggregate.DEMO_SLICES} />
        </div>
        <div className="flex items-center justify-center">
          <aggregate.SegmentedRing slices={aggregate.DEMO_SLICES} />
        </div>
        <div className="flex items-center justify-center">
          <aggregate.ConcentricArcs slices={aggregate.DEMO_SLICES} />
        </div>
      </div>

      <div className="mt-10" data-testid="aggregate-demo">
        <aggregate.MicroVizAggregateDemo />
      </div>
    </div>,
  );

  await document.fonts.ready;

  await expect(page.getByTestId("activity-cadence")).toMatchScreenshot(
    "activity-cadence",
  );
  await expect(page.getByTestId("activity-cadence-dots")).toMatchScreenshot(
    "activity-cadence-dots",
  );

  await expect(page.getByTestId("stripe-density")).toMatchScreenshot(
    "stripe-density",
  );
  await expect(page.getByTestId("gradient-fade")).toMatchScreenshot(
    "gradient-fade",
  );
  await expect(page.getByTestId("perforated")).toMatchScreenshot("perforated");
  await expect(page.getByTestId("shadow-depth")).toMatchScreenshot(
    "shadow-depth",
  );

  await expect(page.getByTestId("pixel-grid")).toMatchScreenshot("pixel-grid");
  await expect(page.getByTestId("waveform")).toMatchScreenshot("waveform");
  await expect(page.getByTestId("dot-cascade")).toMatchScreenshot(
    "dot-cascade",
  );

  await expect(page.getByTestId("mosaic")).toMatchScreenshot("mosaic");
  await expect(page.getByTestId("split-ribbon")).toMatchScreenshot(
    "split-ribbon",
  );
  await expect(page.getByTestId("micro-heatline")).toMatchScreenshot(
    "micro-heatline",
  );

  await expect(page.getByTestId("pipeline")).toMatchScreenshot("pipeline");

  await expect(page.getByTestId("rings")).toMatchScreenshot("rings");

  await expect(page.getByTestId("aggregate-demo")).toMatchScreenshot(
    "aggregate-demo",
  );
});
