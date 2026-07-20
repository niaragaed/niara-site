"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  LineStyle,
  type UTCTimestamp,
} from "lightweight-charts";
import { SlidersHorizontal, X } from "lucide-react";
import { useExchange } from "./ExchangeContext";
import { generateMockCandles, TIMEFRAMES, type Timeframe } from "@/lib/mock-candles";
import {
  calcSMA,
  calcEMA,
  calcBollingerBands,
  calcVWAP,
  calcDonchianChannel,
  calcRSI,
  calcMACD,
  calcStochastic,
  calcATR,
  calcOBV,
  type IndicatorPoint,
} from "@/lib/indicators";
import { en } from "@/lib/i18n/en";

type IndicatorId =
  | "sma9"
  | "sma21"
  | "sma50"
  | "ema9"
  | "ema21"
  | "ema50"
  | "bollinger"
  | "vwap"
  | "donchian"
  | "rsi"
  | "macd"
  | "stochastic"
  | "atr"
  | "obv";

type IndicatorMeta = { id: IndicatorId; label: string; group: "overlay" | "pane" };

const INDICATOR_CATALOG: IndicatorMeta[] = [
  { id: "sma9", label: "SMA 9", group: "overlay" },
  { id: "sma21", label: "SMA 21", group: "overlay" },
  { id: "sma50", label: "SMA 50", group: "overlay" },
  { id: "ema9", label: "EMA 9", group: "overlay" },
  { id: "ema21", label: "EMA 21", group: "overlay" },
  { id: "ema50", label: "EMA 50", group: "overlay" },
  { id: "bollinger", label: en.trade.priceChart.bollinger, group: "overlay" },
  { id: "vwap", label: "VWAP", group: "overlay" },
  { id: "donchian", label: en.trade.priceChart.donchian, group: "overlay" },
  { id: "rsi", label: "RSI (14)", group: "pane" },
  { id: "macd", label: "MACD (12/26/9)", group: "pane" },
  { id: "stochastic", label: en.trade.priceChart.stochastic, group: "pane" },
  { id: "atr", label: "ATR (14)", group: "pane" },
  { id: "obv", label: "OBV", group: "pane" },
];

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function toLineData(points: IndicatorPoint[]) {
  return points.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }));
}

export function PriceChart() {
  const { selectedAsset } = useExchange();
  const containerRef = useRef<HTMLDivElement>(null);

  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [enabled, setEnabled] = useState<IndicatorId[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  function toggleIndicator(id: IndicatorId) {
    setEnabled((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id],
    );
  }

  // Um único efeito reconstrói o gráfico inteiro (candles + volume +
  // indicadores) sempre que ativo, timeframe ou indicadores mudam. Mais
  // simples e robusto do que atualizar séries/panes individualmente, e o
  // custo é irrelevante para ~200 candles mock. `chart.remove()` já limpa
  // todas as séries/panes de uma vez — cuidado com StrictMode (o cleanup
  // roda antes de cada nova execução do efeito, não só no unmount real).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const styles = getComputedStyle(document.documentElement);
    const cssVar = (name: string) => styles.getPropertyValue(name).trim();
    const colors = {
      border: cssVar("--color-border"),
      textMuted: cssVar("--color-text-muted"),
      positive: cssVar("--color-positive"),
      negative: cssVar("--color-negative"),
      accentBlue: cssVar("--color-accent-blue"),
      accentViolet: cssVar("--color-accent-violet"),
      accentCyan: cssVar("--color-accent-cyan"),
      warning: cssVar("--color-warning"),
    };
    const palette = [
      colors.accentBlue,
      colors.accentViolet,
      colors.accentCyan,
      colors.warning,
      colors.positive,
    ];
    let paletteIndex = 0;
    const nextColor = () => palette[paletteIndex++ % palette.length];

    const candles = generateMockCandles(
      selectedAsset.symbol,
      selectedAsset.priceUsdt,
      timeframe,
    );

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: colors.textMuted,
        panes: { separatorColor: colors.border },
      },
      grid: {
        vertLines: { color: colors.border },
        horzLines: { color: colors.border },
      },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { borderColor: colors.border, timeVisible: true },
      autoSize: false,
      width: container.clientWidth,
      height: container.clientHeight,
    });

    const candleSeries = chart.addSeries(
      CandlestickSeries,
      {
        upColor: colors.positive,
        downColor: colors.negative,
        borderUpColor: colors.positive,
        borderDownColor: colors.negative,
        wickUpColor: colors.positive,
        wickDownColor: colors.negative,
      },
      0,
    );
    candleSeries.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );

    const volumeSeries = chart.addSeries(
      HistogramSeries,
      { priceFormat: { type: "volume" }, priceScaleId: "" },
      0,
    );
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volumeSeries.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color:
          c.close >= c.open
            ? hexToRgba(colors.positive, 0.5)
            : hexToRgba(colors.negative, 0.5),
      })),
    );

    for (const id of enabled) {
      switch (id) {
        case "sma9":
        case "sma21":
        case "sma50": {
          const period = Number(id.replace("sma", ""));
          const s = chart.addSeries(
            LineSeries,
            { color: nextColor(), lineWidth: 1, priceLineVisible: false, lastValueVisible: false },
            0,
          );
          s.setData(toLineData(calcSMA(candles, period)));
          break;
        }
        case "ema9":
        case "ema21":
        case "ema50": {
          const period = Number(id.replace("ema", ""));
          const s = chart.addSeries(
            LineSeries,
            {
              color: nextColor(),
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              priceLineVisible: false,
              lastValueVisible: false,
            },
            0,
          );
          s.setData(toLineData(calcEMA(candles, period)));
          break;
        }
        case "bollinger": {
          const { upper, middle, lower } = calcBollingerBands(candles);
          const color = nextColor();
          const mid = chart.addSeries(
            LineSeries,
            { color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false },
            0,
          );
          mid.setData(toLineData(middle));
          const bandOpts = {
            color: hexToRgba(color, 0.5),
            lineWidth: 1 as const,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
            lastValueVisible: false,
          };
          chart.addSeries(LineSeries, bandOpts, 0).setData(toLineData(upper));
          chart.addSeries(LineSeries, bandOpts, 0).setData(toLineData(lower));
          break;
        }
        case "vwap": {
          const s = chart.addSeries(
            LineSeries,
            { color: nextColor(), lineWidth: 1, priceLineVisible: false, lastValueVisible: false },
            0,
          );
          s.setData(toLineData(calcVWAP(candles)));
          break;
        }
        case "donchian": {
          const { upper, middle, lower } = calcDonchianChannel(candles);
          const color = nextColor();
          const mid = chart.addSeries(
            LineSeries,
            { color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false },
            0,
          );
          mid.setData(toLineData(middle));
          const bandOpts = {
            color: hexToRgba(color, 0.5),
            lineWidth: 1 as const,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
            lastValueVisible: false,
          };
          chart.addSeries(LineSeries, bandOpts, 0).setData(toLineData(upper));
          chart.addSeries(LineSeries, bandOpts, 0).setData(toLineData(lower));
          break;
        }
        case "rsi": {
          const pane = chart.addPane();
          const s = chart.addSeries(
            LineSeries,
            { color: nextColor(), lineWidth: 1 },
            pane.paneIndex(),
          );
          s.setData(toLineData(calcRSI(candles)));
          break;
        }
        case "macd": {
          const pane = chart.addPane();
          const paneIndex = pane.paneIndex();
          const { macd, signal, histogram } = calcMACD(candles);
          chart
            .addSeries(LineSeries, { color: nextColor(), lineWidth: 1 }, paneIndex)
            .setData(toLineData(macd));
          chart
            .addSeries(LineSeries, { color: nextColor(), lineWidth: 1 }, paneIndex)
            .setData(toLineData(signal));
          chart
            .addSeries(HistogramSeries, { color: colors.textMuted }, paneIndex)
            .setData(
              histogram.map((p) => ({
                time: p.time as UTCTimestamp,
                value: p.value,
                color:
                  p.value >= 0
                    ? hexToRgba(colors.positive, 0.6)
                    : hexToRgba(colors.negative, 0.6),
              })),
            );
          break;
        }
        case "stochastic": {
          const pane = chart.addPane();
          const paneIndex = pane.paneIndex();
          const { k, d } = calcStochastic(candles);
          chart
            .addSeries(LineSeries, { color: nextColor(), lineWidth: 1 }, paneIndex)
            .setData(toLineData(k));
          chart
            .addSeries(LineSeries, { color: nextColor(), lineWidth: 1 }, paneIndex)
            .setData(toLineData(d));
          break;
        }
        case "atr": {
          const pane = chart.addPane();
          const s = chart.addSeries(
            LineSeries,
            { color: nextColor(), lineWidth: 1 },
            pane.paneIndex(),
          );
          s.setData(toLineData(calcATR(candles)));
          break;
        }
        case "obv": {
          const pane = chart.addPane();
          const s = chart.addSeries(
            LineSeries,
            { color: nextColor(), lineWidth: 1 },
            pane.paneIndex(),
          );
          s.setData(toLineData(calcOBV(candles)));
          break;
        }
      }
    }

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      chart.resize(width, height);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [selectedAsset.symbol, selectedAsset.priceUsdt, timeframe, enabled]);

  const filteredCatalog = INDICATOR_CATALOG.filter((meta) =>
    meta.label.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div role="group" aria-label={en.trade.priceChart.timeframeAriaLabel} className="flex items-center gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              aria-pressed={timeframe === tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                timeframe === tf
                  ? "bg-bg-elevated text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            {en.trade.priceChart.indicators}
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
                  {en.trade.priceChart.searchIndicatorLabel}
                </label>
                <input
                  id="indicator-search"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={en.trade.priceChart.searchIndicatorPlaceholder}
                  className="mb-2 w-full rounded border border-border bg-bg-base px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-blue"
                />
                <div className="max-h-64 overflow-auto">
                  {(["overlay", "pane"] as const).map((group) => {
                    const items = filteredCatalog.filter((meta) => meta.group === group);
                    if (items.length === 0) return null;
                    return (
                      <div key={group} className="mb-2">
                        <p className="px-1 pb-1 text-[10px] uppercase tracking-wide text-text-muted">
                          {group === "overlay"
                            ? en.trade.priceChart.overlayGroup
                            : en.trade.priceChart.paneGroup}
                        </p>
                        {items.map((meta) => (
                          <label
                            key={meta.id}
                            className="flex items-center gap-2 rounded px-1 py-1.5 text-xs text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                          >
                            <input
                              type="checkbox"
                              checked={enabled.includes(meta.id)}
                              onChange={() => toggleIndicator(meta.id)}
                              className="accent-accent-blue"
                            />
                            {meta.label}
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {enabled.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-border px-3 py-2">
          {enabled.map((id) => {
            const meta = INDICATOR_CATALOG.find((item) => item.id === id);
            if (!meta) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-bg-elevated px-2 py-0.5 text-[11px] text-text-secondary"
              >
                {meta.label}
                <button
                  type="button"
                  aria-label={en.trade.priceChart.removeIndicator(meta.label)}
                  onClick={() => toggleIndicator(id)}
                  className="text-text-muted transition-colors hover:text-negative"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div ref={containerRef} className="min-h-[320px] flex-1" />
    </div>
  );
}
