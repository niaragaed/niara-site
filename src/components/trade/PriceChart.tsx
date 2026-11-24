"use client";

// Terminal price chart (restored from the Phase 2C terminal: candlesticks, indicator
// toolbar, crosshair and timeframes), fed ONLY by settled trades from
// `GET /v1/trades/:chain/:asset`. Nothing is invented:
// - intervals without trades are whitespace (a slot with no bar), so bars keep a
//   uniform width without a synthetic price;
// - volume sits in its own pane, colored by the taker side that dominated the interval;
// - an indicator is computed only when the timeframe has enough intervals with
//   trades; otherwise it says "not enough data" and draws nothing;
// - no settled trade → the empty state.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { SlidersHorizontal, X } from "lucide-react";
import { CANDLE_INTERVALS, buildCandles, fillGaps, pricePrecision, type Candle, type CandleInterval } from "@/lib/exchange/candles";
import { formatUnitsExact } from "@/lib/exchange/units";
import {
  INDICATOR_GROUP,
  INDICATOR_MIN_CANDLES,
  calcATR,
  calcBollingerBands,
  calcDonchianChannel,
  calcEMA,
  calcMACD,
  calcOBV,
  calcRSI,
  calcSMA,
  calcStochastic,
  calcVWAP,
  hasEnoughData,
  type IndicatorCandle,
  type IndicatorId,
  type IndicatorPoint,
} from "@/lib/indicators";
import { en } from "@/lib/i18n/en";
import { engineErrorMessage } from "./OrderTicket";
import { useTrade } from "./TradeContext";
import { useMarketTrades } from "./useMarketTrades";

const t = en.trade.priceChart;

const INDICATOR_LABEL: Record<IndicatorId, string> = {
  sma9: "SMA 9",
  sma21: "SMA 21",
  sma50: "SMA 50",
  ema9: "EMA 9",
  ema21: "EMA 21",
  ema50: "EMA 50",
  bollinger: t.bollinger,
  vwap: "VWAP",
  donchian: t.donchian,
  rsi: "RSI (14)",
  macd: "MACD (12/26/9)",
  stochastic: t.stochastic,
  atr: "ATR (14)",
  obv: "OBV",
};

const INDICATOR_ORDER = Object.keys(INDICATOR_LABEL) as IndicatorId[];

/** Fixed bar spacing (px): bars keep their width whatever the number of intervals. */
const BAR_SPACING = 8;
/** Price pane : volume pane = 4 : 1 (volume ≈ 20% of the height). */
const PRICE_STRETCH = 4;
const VOLUME_STRETCH = 1;
const INDICATOR_STRETCH = 1.25;

function hexToRgba(color: string, alpha: number): string {
  const clean = color.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return color;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function toLineData(points: IndicatorPoint[]) {
  return points.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }));
}

/** Exact price text with a fixed number of places (precision is chosen so it is exact). */
function priceText(value: bigint, decimals: number, precision: number): string {
  const text = formatUnitsExact(value, decimals, true);
  const [whole, frac = ""] = text.split(".");
  return precision > 0 ? `${whole}.${frac.padEnd(precision, "0")}` : whole;
}

function slotTime(time: number, seconds: number): string {
  const opts: Intl.DateTimeFormatOptions =
    seconds >= 86400
      ? { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }
      : { timeZone: "UTC", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" };
  return `${new Date(time * 1000).toLocaleString("en-US", opts)} UTC`;
}

type ChartColors = {
  border: string;
  muted: string;
  secondary: string;
  elevated: string;
  positive: string;
  negative: string;
  palette: string[];
};

function readColors(): ChartColors {
  const styles = getComputedStyle(document.documentElement);
  const v = (name: string) => styles.getPropertyValue(name).trim();
  return {
    border: v("--color-border"),
    muted: v("--color-text-muted"),
    secondary: v("--color-text-secondary"),
    elevated: v("--color-bg-elevated"),
    positive: v("--color-positive"),
    negative: v("--color-negative"),
    palette: [v("--color-accent-blue"), v("--color-accent-violet"), v("--color-accent-cyan"), v("--color-warning"), v("--color-positive")],
  };
}

/** Adds the series of one indicator; panes are created for oscillators. */
function addIndicator(chart: IChartApi, id: IndicatorId, data: IndicatorCandle[], colors: ChartColors, nextColor: () => string) {
  const line = { lineWidth: 1 as const, priceLineVisible: false, lastValueVisible: false };
  const addBand = (bands: { upper: IndicatorPoint[]; middle: IndicatorPoint[]; lower: IndicatorPoint[] }) => {
    const color = nextColor();
    chart.addSeries(LineSeries, { ...line, color }, 0).setData(toLineData(bands.middle));
    const band = { ...line, color: hexToRgba(color, 0.5), lineStyle: LineStyle.Dashed };
    chart.addSeries(LineSeries, band, 0).setData(toLineData(bands.upper));
    chart.addSeries(LineSeries, band, 0).setData(toLineData(bands.lower));
  };
  const newPane = () => {
    const pane = chart.addPane();
    pane.setStretchFactor(INDICATOR_STRETCH);
    return pane.paneIndex();
  };

  switch (id) {
    case "sma9":
    case "sma21":
    case "sma50":
      chart.addSeries(LineSeries, { ...line, color: nextColor() }, 0).setData(toLineData(calcSMA(data, Number(id.slice(3)))));
      return;
    case "ema9":
    case "ema21":
    case "ema50":
      chart
        .addSeries(LineSeries, { ...line, color: nextColor(), lineStyle: LineStyle.Dashed }, 0)
        .setData(toLineData(calcEMA(data, Number(id.slice(3)))));
      return;
    case "bollinger":
      addBand(calcBollingerBands(data));
      return;
    case "vwap":
      chart.addSeries(LineSeries, { ...line, color: nextColor() }, 0).setData(toLineData(calcVWAP(data)));
      return;
    case "donchian":
      addBand(calcDonchianChannel(data));
      return;
    case "rsi": {
      const pane = newPane();
      chart.addSeries(LineSeries, { lineWidth: 1, color: nextColor() }, pane).setData(toLineData(calcRSI(data)));
      return;
    }
    case "macd": {
      const pane = newPane();
      const { macd, signal, histogram } = calcMACD(data);
      chart.addSeries(LineSeries, { lineWidth: 1, color: nextColor() }, pane).setData(toLineData(macd));
      chart.addSeries(LineSeries, { lineWidth: 1, color: nextColor() }, pane).setData(toLineData(signal));
      chart.addSeries(HistogramSeries, { color: colors.muted, priceLineVisible: false, lastValueVisible: false }, pane).setData(
        histogram.map((p) => ({
          time: p.time as UTCTimestamp,
          value: p.value,
          color: hexToRgba(p.value >= 0 ? colors.positive : colors.negative, 0.6),
        })),
      );
      return;
    }
    case "stochastic": {
      const pane = newPane();
      const { k, d } = calcStochastic(data);
      chart.addSeries(LineSeries, { lineWidth: 1, color: nextColor() }, pane).setData(toLineData(k));
      chart.addSeries(LineSeries, { lineWidth: 1, color: nextColor() }, pane).setData(toLineData(d));
      return;
    }
    case "atr": {
      const pane = newPane();
      chart.addSeries(LineSeries, { lineWidth: 1, color: nextColor() }, pane).setData(toLineData(calcATR(data)));
      return;
    }
    case "obv": {
      const pane = newPane();
      chart.addSeries(LineSeries, { lineWidth: 1, color: nextColor() }, pane).setData(toLineData(calcOBV(data)));
      return;
    }
  }
}

function Legend({
  candle,
  time,
  seconds,
  decimals,
  precision,
}: {
  candle: Candle | null;
  time: number;
  seconds: number;
  decimals: number;
  precision: number;
}) {
  const p = (v: bigint) => priceText(v, decimals, precision);
  const tone = candle && candle.close < candle.open ? "text-negative" : "text-positive";
  return (
    <div className="pointer-events-none absolute left-2 top-1 z-10 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[11px] tabular-nums">
      <span className="text-text-muted">{slotTime(time, seconds)}</span>
      {candle ? (
        <>
          {(
            [
              ["O", candle.open],
              ["H", candle.high],
              ["L", candle.low],
              ["C", candle.close],
            ] as const
          ).map(([k, v]) => (
            <span key={k} className="text-text-muted">
              {k} <span className={tone}>{p(v)}</span>
            </span>
          ))}
          <span className="text-text-muted">
            {t.volume} <span className="text-text-secondary">{candle.lots.toString()}</span> {t.lots}
            {" ("}
            <span className="text-positive">{candle.buyLots.toString()}</span>/
            <span className="text-negative">{candle.sellLots.toString()}</span>
            {")"}
          </span>
        </>
      ) : (
        <span className="text-text-muted">{t.noTrades}</span>
      )}
    </div>
  );
}

export function PriceChart() {
  const { listing, terms } = useTrade();
  const trades = useMarketTrades();
  const containerRef = useRef<HTMLDivElement>(null);

  const [timeframe, setTimeframe] = useState<CandleInterval>("1h");
  const [enabled, setEnabled] = useState<IndicatorId[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const items = useMemo(() => trades.data?.items ?? [], [trades.data]);
  const interval = CANDLE_INTERVALS.find((i) => i.id === timeframe)!;
  const decimals = terms?.usdt.decimals;

  const { slots, truncated, real, precision } = useMemo(() => {
    const candles = buildCandles(items, interval.seconds, interval.offset);
    const filled = fillGaps(candles, interval.seconds);
    const shown = filled.slots.flatMap((s) => (s.candle ? [s.candle] : []));
    return {
      ...filled,
      real: shown,
      precision: decimals === undefined ? 2 : pricePrecision(shown, decimals),
    };
  }, [items, interval.seconds, interval.offset, decimals]);

  const slotByTime = useMemo(() => new Map(slots.map((s) => [s.time, s])), [slots]);
  const ready = useMemo(() => enabled.filter((id) => hasEnoughData(id, real.length)), [enabled, real.length]);
  const readyKey = ready.join(",");

  function toggleIndicator(id: IndicatorId) {
    setEnabled((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  // One effect rebuilds the whole chart when the data, timeframe or drawn indicators
  // change. `chart.remove()` disposes every series and pane; the cleanup also runs
  // between the two effect runs of React StrictMode in dev.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || decimals === undefined || slots.length === 0) return;
    const colors = readColors();
    let paletteIndex = 0;
    const nextColor = () => colors.palette[paletteIndex++ % colors.palette.length];
    const minMove = 1 / 10 ** precision;
    // Display only: exact bigint prices become numbers for the chart axis.
    const num = (x: bigint) => Number(formatUnitsExact(x, decimals));

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: colors.muted,
        fontFamily: getComputedStyle(el).fontFamily,
        panes: { separatorColor: colors.border, separatorHoverColor: hexToRgba(colors.border, 0.6), enableResize: true },
      },
      grid: { vertLines: { color: colors.border }, horzLines: { color: colors.border } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: colors.muted, labelBackgroundColor: colors.elevated, style: LineStyle.Dashed },
        horzLine: { color: colors.muted, labelBackgroundColor: colors.elevated, style: LineStyle.Dashed },
      },
      // Top margin leaves room for the OHLC legend.
      rightPriceScale: { borderColor: colors.border, scaleMargins: { top: 0.14, bottom: 0.06 } },
      timeScale: {
        borderColor: colors.border,
        timeVisible: interval.seconds < 86400,
        secondsVisible: false,
        barSpacing: BAR_SPACING,
        minBarSpacing: 2,
        rightOffset: 4,
      },
    });

    const priceFormat = { type: "price" as const, precision, minMove };
    chart
      .addSeries(
        CandlestickSeries,
        {
          upColor: colors.positive,
          downColor: colors.negative,
          borderUpColor: colors.positive,
          borderDownColor: colors.negative,
          wickUpColor: colors.positive,
          wickDownColor: colors.negative,
          priceFormat,
        },
        0,
      )
      .setData(
        slots.map((s) => {
          const time = s.time as UTCTimestamp;
          const c = s.candle;
          return c ? { time, open: num(c.open), high: num(c.high), low: num(c.low), close: num(c.close) } : { time };
        }),
      );

    // Volume in its own pane, colored by the taker side with more lots in the interval.
    chart
      .addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: false }, 1)
      .setData(
        slots.map((s) => {
          const time = s.time as UTCTimestamp;
          const c = s.candle;
          if (!c) return { time };
          const color =
            c.buyLots > c.sellLots
              ? hexToRgba(colors.positive, 0.6)
              : c.sellLots > c.buyLots
                ? hexToRgba(colors.negative, 0.6)
                : hexToRgba(colors.muted, 0.6);
          return { time, value: Number(c.lots), color };
        }),
      );
    const panes = chart.panes();
    panes[0]?.setStretchFactor(PRICE_STRETCH);
    panes[1]?.setStretchFactor(VOLUME_STRETCH);

    const indicatorData: IndicatorCandle[] = real.map((c) => ({
      time: c.time,
      open: num(c.open),
      high: num(c.high),
      low: num(c.low),
      close: num(c.close),
      volume: Number(c.lots),
    }));
    for (const id of readyKey ? (readyKey.split(",") as IndicatorId[]) : []) {
      addIndicator(chart, id, indicatorData, colors, nextColor);
    }

    const onMove = (param: { time?: unknown }) => setHoverTime(typeof param.time === "number" ? param.time : null);
    chart.subscribeCrosshairMove(onMove);

    return () => {
      chart.unsubscribeCrosshairMove(onMove);
      chart.remove();
    };
  }, [slots, real, decimals, precision, readyKey, interval.seconds]);

  const filteredCatalog = INDICATOR_ORDER.filter((id) =>
    INDICATOR_LABEL[id].toLowerCase().includes(search.trim().toLowerCase()),
  );

  const legendSlot = (hoverTime !== null ? slotByTime.get(hoverTime) : undefined) ?? slots[slots.length - 1];
  const hasData = Boolean(listing) && !trades.error && !trades.isLoading && decimals !== undefined && items.length > 0;

  return (
    <section
      aria-labelledby="price-chart-heading"
      className="flex h-full min-h-[320px] flex-col rounded-md border border-border bg-bg-surface"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h2 id="price-chart-heading" className="text-sm font-semibold text-text-primary">
            {t.title}
            {listing?.symbol && <span className="ml-2 font-mono text-xs text-text-muted">{listing.symbol}/USDT</span>}
          </h2>
          {hasData && (
            <div role="group" aria-label={t.timeframeAria} className="flex items-center gap-1">
              {CANDLE_INTERVALS.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  aria-pressed={timeframe === i.id}
                  onClick={() => setTimeframe(i.id)}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue ${
                    timeframe === i.id ? "bg-bg-elevated text-text-primary" : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {i.id}
                </button>
              ))}
            </div>
          )}
        </div>

        {hasData && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              {t.indicators}
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-md border border-border bg-bg-elevated p-3 shadow-lg">
                  <label htmlFor="indicator-search" className="sr-only">
                    {t.searchIndicatorLabel}
                  </label>
                  <input
                    id="indicator-search"
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t.searchIndicatorPlaceholder}
                    className="mb-2 w-full rounded border border-border bg-bg-base px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-blue"
                  />
                  <div className="max-h-64 overflow-auto">
                    {(["overlay", "pane"] as const).map((group) => {
                      const ids = filteredCatalog.filter((id) => INDICATOR_GROUP[id] === group);
                      if (ids.length === 0) return null;
                      return (
                        <div key={group} className="mb-2">
                          <p className="px-1 pb-1 text-[10px] uppercase tracking-wide text-text-muted">
                            {group === "overlay" ? t.overlayGroup : t.paneGroup}
                          </p>
                          {ids.map((id) => {
                            const need = INDICATOR_MIN_CANDLES[id];
                            const enough = real.length >= need;
                            return (
                              <label
                                key={id}
                                className="flex items-center gap-2 rounded px-1 py-1.5 text-xs text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                              >
                                <input
                                  type="checkbox"
                                  checked={enabled.includes(id)}
                                  onChange={() => toggleIndicator(id)}
                                  className="accent-accent-blue"
                                />
                                <span className="flex-1">{INDICATOR_LABEL[id]}</span>
                                {!enough && (
                                  <span className="font-mono text-[10px] tabular-nums text-text-muted">
                                    {real.length}/{need}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {hasData && enabled.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 border-b border-border px-3 py-2">
          {enabled.map((id) => {
            const label = INDICATOR_LABEL[id];
            const need = INDICATOR_MIN_CANDLES[id];
            const enough = real.length >= need;
            return (
              <li
                key={id}
                title={enough ? undefined : t.notEnoughDetail(label, real.length, need)}
                className={`inline-flex items-center gap-1 rounded-full border bg-bg-elevated px-2 py-0.5 text-[11px] ${
                  enough ? "border-border text-text-secondary" : "border-warning/40 text-warning"
                }`}
              >
                {label}
                {!enough && <span className="text-[10px]">· {t.notEnoughData(real.length, need)}</span>}
                <button
                  type="button"
                  aria-label={t.removeIndicator(label)}
                  onClick={() => toggleIndicator(id)}
                  className="text-text-muted transition-colors hover:text-negative focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!listing ? null : trades.error ? (
        <p className="px-3 py-4 text-xs text-negative">{engineErrorMessage(trades.error)}</p>
      ) : trades.isLoading || decimals === undefined ? (
        <p className="px-3 py-4 text-xs text-text-muted">{en.trade.chart.loading}</p>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-6 py-12 text-center">
          <p className="text-sm text-text-secondary">{en.trade.chart.empty}</p>
          <p className="max-w-md text-xs text-text-muted">{en.trade.chart.emptyDetail}</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          {/* Decorative: the same trades are listed in the trade history table. */}
          <div aria-hidden="true" className="relative h-[420px] w-full flex-1 lg:h-auto lg:min-h-[420px]">
            {legendSlot && (
              <Legend
                candle={legendSlot.candle}
                time={legendSlot.time}
                seconds={interval.seconds}
                decimals={decimals}
                precision={precision}
              />
            )}
            <div ref={containerRef} className="absolute inset-0" />
          </div>
          <p className="border-t border-border px-3 py-1.5 text-[11px] text-text-muted">
            {t.source(items.length, trades.data?.complete === false)}
            {truncated && ` ${t.truncated(slots.length)}`}
          </p>
        </div>
      )}
    </section>
  );
}
