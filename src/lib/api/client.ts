/* eslint-disable @typescript-eslint/no-explicit-any */
import { requestCache } from '@/utils/requestCache'
import { deduplicateRequest } from '@/utils/deduplicateRequest'

export const API_BASE: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://127.0.0.1:8000'

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
  if (!params) return url

  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    query.set(key, String(value))
  })
  if (query.toString() === '') return url

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${query.toString()}`
}

async function get<T>(path: string, params?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(buildUrl(path, params), { signal })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

async function post<T>(path: string, body?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(buildUrl(path, undefined), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

function toNumber(value: any, defaultValue = 0): number {
    if (value == null) return defaultValue;
    if (typeof value === 'number') return Number.isFinite(value) ? value : defaultValue;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return defaultValue;
        if (trimmed.endsWith('%')) {
            const pct = Number(trimmed.slice(0, -1));
            return Number.isFinite(pct) ? pct / 100 : defaultValue;
        }
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : defaultValue;
    }
    return defaultValue;
}

function normalizeBacktestResult(raw: any): BacktestResult {
    const metrics = raw?.metrics || {};
    const normalizedMetrics = {
        total_return: toNumber(
            metrics.total_return ?? metrics.totalReturn ?? metrics['Total Return'],
            0
        ),
        cagr: toNumber(
            metrics.cagr ??
            metrics.CAGR ??
            metrics.annual_return ??
            metrics.annualized_return,
            0
        ),
        sharpe: toNumber(
            metrics.sharpe ??
            metrics.sharpe_ratio ??
            metrics.sharpeRatio ??
            metrics['Sharpe Ratio'],
            0
        ),
        max_drawdown: toNumber(
            metrics.max_drawdown ??
            metrics.maxDrawdown ??
            metrics['Max Drawdown'],
            0
        ),
        turnover: toNumber(
            metrics.turnover ??
            metrics.avg_turnover ??
            metrics.avgTurnover,
            0
        ),
    };

    return {
        metrics: normalizedMetrics,
        equity_curve: Array.isArray(raw?.equity_curve) ? raw.equity_curve : [],
        drawdown_curve: Array.isArray(raw?.drawdown_curve) ? raw.drawdown_curve : [],
        holdings_heatmap: Array.isArray(raw?.holdings_heatmap) ? raw.holdings_heatmap : [],
        logs: Array.isArray(raw?.logs) ? raw.logs : [],
        trade_logs: Array.isArray(raw?.trade_logs) ? raw.trade_logs : [],
        metadata: raw?.metadata || {},
    };
}

export interface StrategyParamSpec {
    key: string;
    label: string;
    type: string;
    default: any;
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
    group?: string;
    description?: string;
    optimize?: boolean;
    optimize_range?: { min: number; max: number; step: number };
}

export interface StrategySpec {
    id: string;
    name: string;
    name_zh: string;
    description: string;
    description_zh: string;
    data_requirement: string;
    params: StrategyParamSpec[];
    tags: string[];
}

export interface BacktestParams {
    strategy_id: string;
    params: Record<string, any>;
    start_date?: string;
    end_date?: string;
    market?: string;
}

export interface BacktestResult {
    metrics: {
        total_return: number;
        cagr: number;
        sharpe: number;
        max_drawdown: number;
        turnover?: number;
    };
    equity_curve: {
        time: string;
        value: number;
    }[];
    drawdown_curve: {
        time: string;
        value: number;
    }[];
    holdings_heatmap: {
        date: string;
        ticker: string;
        weight: number;
    }[];
    logs: any[];
    trade_logs?: {
        Date: string;
        Action: string;
        Ticker: string;
        Price: number;
        Shares: number;
        Weight?: number;
        Reason?: string;
        PnL?: number;
        Type?: string;
        Snapshot?: {
            holdings: string[];
            cash_weight: string;
            total_equity: number;
        };
        [key: string]: any;
    }[];
    metadata?: Record<string, any>;
}

export interface ScreenerResult {
    symbol: string;
    name?: string;
    alpha_score: number;
    rs_score: number;
    value_score?: number;
    quality_score?: number;
    price: number;
    volume: number;
    sector?: string;
    industry?: string;
    social_buzz?: number;
    ad_ratio?: number;
    atr_tightness?: number;
    fundamentals?: {
        pe_ratio?: number | string;
        pb_ratio?: number | string;
        roe?: number | string;
    };
    [key: string]: any;
}
export interface ScreenerTabResults {
    momentum: ScreenerResult[];
    value: ScreenerResult[];
    combined: ScreenerResult[];
}

export interface ScreenerStatus {
    status: 'idle' | 'running' | 'completed' | 'error' | 'started';
    data: ScreenerTabResults | ScreenerResult[]; // Handle both old and new formats for transition
    error?: string;
    timestamp?: string;
    started_at?: string;
    poll_timeout_seconds?: number;
}

export interface SyncTaskStatus {
    status: 'idle' | 'running' | 'completed' | 'error';
    last_run?: string;
    error?: string;
    data?: any;
    progress?: number;
    total?: number;
    /** 实时阶段：downloading=下载中, rate_limited=限流等待中, validating=校验中, writing=写入中, idle=空闲 */
    phase?: string;
    /** 阶段详情（如 "腾讯限流窗口，等待 ~72s 后继续"） */
    phase_detail?: string;
    /** 本次同步开始时间 ISO */
    started_at?: string;
}

export interface FullSyncStatus {
    market: SyncTaskStatus;
    options: SyncTaskStatus;
    intraday: SyncTaskStatus;
}

export interface OptimizationParams {
    strategy_id: string;
    params: Record<string, any>;
    param_ranges: Record<string, { min: number; max: number; step: number; optimize?: boolean }>;
    method: 'grid' | 'genetic' | 'bayesian' | 'differential_evolution';
    metric: string;
    start_date?: string;
    end_date?: string;
    market?: string;
    pop_size?: number;
    generations?: number;
    max_combinations?: number;
}

export interface OptimizationResult {
    best_params: Record<string, any>;
    results: any[];
    method: string;
    metric: string;
}

export interface OptimizationHistoryRecord {
    id: string;
    strategy_id: string;
    method: string;
    metric: string;
    best_params: Record<string, any>;
    results: any[];
    timestamp: string;
    name: string;
    market?: string;
}

export interface SignalItem {
    ticker: string;
    action: string;
    weight: number;
    price: number;
    reason: string;
    date: string;
}

export interface SignalResult {
    date: string;
    market_status: string;
    signals: SignalItem[];
    portfolio: {
        ticker: string;
        shares: number;
        weight: string;
        price: number;
        entry_price: number;
        unrealized_pnl: number;
    }[];
    total_equity: number;
    cash: number;
    cash_weight: string;
    is_intraday?: boolean;
    adaptive_trigger?: boolean;
    metadata?: Record<string, any>;
}

export interface PortfolioPosition {
    ticker: string;
    name?: string;           // 仅 CN 有中文名
    weight: string;          // "12.5%"
    weight_value: number;    // 0.125
    price: number;
    overlapping: boolean;
    sources: { strategy: string; weight: number }[];
}

export interface PortfolioSignalResult {
    date: string;
    market_status: string;
    portfolio: PortfolioPosition[];
    sub_portfolios: Record<string, any[]>;
    sub_signals: Record<string, any[]>;
    strategy_weights: Record<string, number>;
    cash_weight: string;
    metadata: Record<string, any>;
}

export interface MacdIndicators { dif: number | null; dea: number | null; hist: number | null; state: 'golden' | 'dead' | 'flat' }
export interface AnalysisIndicators {
  close: number | null
  macd: MacdIndicators
  kdj: { k: number | null; d: number | null; j: number | null }
  rsi14: number | null
  sma20: number | null; sma50: number | null; sma200: number | null
}
export interface BuyPointSignal {
  rule_id: string; name: string; triggered: boolean
  trigger_date: string | null; note: string
}
export interface RuleBacktest {
  rule_id: string; name: string; signals: number
  avg_ret_5d: number; avg_ret_10d: number; avg_ret_20d: number
  win_rate_5d: number; win_rate_10d: number; win_rate_20d: number
  last_trigger: string | null
}
export interface LiveSnapshot {
  source: string; date: string; close: number
  dif: number; dea: number
  rsi_6: number; rsi_12: number; rsi_24: number
  kdj_k: number; kdj_d: number; kdj_j: number
}
export interface AnalysisResult {
  symbol: string; market: string; as_of: string
  indicators: AnalysisIndicators
  buy_points: BuyPointSignal[]
  backtest: RuleBacktest[]
  live_snapshot: LiveSnapshot | null
  errors: string[]
}

export interface ScorerItem {
    ticker: string;
    absolute_score: number;
    score: number;
    regime: string;
    recommendation: string;
    price: number;
    sub_scores: Record<string, number>;
}

export interface ScorerResponse {
    count: number;
    strong_buy_count: number;
    avg_score: number;
    results: ScorerItem[];
}

function normalizeSignalResult(raw: any): SignalResult {
    const meta = raw?.metadata ?? {};
    return {
        date: raw?.date ?? '',
        market_status: raw?.market_status ?? 'Unknown',
        signals: Array.isArray(raw?.signals) ? raw.signals : [],
        portfolio: Array.isArray(raw?.portfolio) ? raw.portfolio : [],
        total_equity: meta.total_equity ?? raw?.total_equity ?? 0,
        cash: meta.cash ?? raw?.cash ?? 0,
        cash_weight: raw?.cash_weight ?? '0%',
        is_intraday: meta.is_intraday ?? raw?.is_intraday ?? false,
        adaptive_trigger: meta.adaptive_trigger ?? raw?.adaptive_trigger ?? false,
        metadata: meta,
    };
}

export const api = {
    get,
    post,

    async runBacktest(params: BacktestParams): Promise<BacktestResult> {
        const response = await fetch(`${API_BASE}/backtest/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Backtest failed');
        }

        const raw = await response.json();
        return normalizeBacktestResult(raw);
    },

    async runOptimization(params: OptimizationParams, onProgress?: (progress: number, processed: number, total: number, best?: any) => void, onTaskId?: (taskId: string) => void, signal?: AbortSignal): Promise<OptimizationResult> {
        const throwIfAborted = () => {
            if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        };
        const response = await fetch(`${API_BASE}/backtest/optimize/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
            signal,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Optimization failed to start');
        }

        const { task_id } = await response.json();
        if (onTaskId) onTaskId(task_id);
        
        while (true) {
            throwIfAborted();
            await new Promise((resolve, reject) => {
                const timer = setTimeout(resolve, 1500);
                signal?.addEventListener('abort', () => {
                    clearTimeout(timer);
                    reject(new DOMException('Aborted', 'AbortError'));
                }, { once: true });
            });
            const statusRes = await fetch(`${API_BASE}/backtest/optimize/status/${task_id}`, { signal });
            if (!statusRes.ok) {
                const error = await statusRes.json().catch(() => ({}));
                throw new Error(error.detail || 'Failed to fetch optimization status');
            }
            const statusData = await statusRes.json();
            if (statusData.status === 'completed') {
                return statusData.result;
            } else if (statusData.status === 'error') {
                throw new Error(statusData.error || 'Optimization task failed');
            } else if (statusData.status === 'aborted') {
                throw new Error('Optimization aborted by user');
            } else if (statusData.status === 'running' || statusData.status === 'idle') {
                if (onProgress) {
                    onProgress(statusData.progress ?? 0, statusData.processed ?? 0, statusData.total ?? 0, statusData.current_best);
                }
            }
        }
    },

    async abortOptimization(taskId: string): Promise<void> {
        const response = await fetch(`${API_BASE}/backtest/optimize/abort/${taskId}`, {
            method: 'POST',
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Failed to abort optimization');
        }
    },

    async runScorer(tickers: string[] = [], params: Record<string, any> = {}, market?: string): Promise<ScorerResponse> {
        const response = await fetch(`${API_BASE}/scorer/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tickers, params, market }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Scorer failed');
        }

        return response.json();
    },

    async runScreener(top_n?: number, market?: string): Promise<ScreenerStatus> {
        const _top_n = top_n ?? 20
        const params = new URLSearchParams({ top_n: String(_top_n) })
        if (market) params.set('market', market)
        requestCache.invalidate(`screener:status:${market ?? 'US'}`) // clear stale cache on new scan
        return deduplicateRequest(`screener:run:${_top_n}:${market ?? 'US'}`, async () => {
            const response = await fetch(`${API_BASE}/screener/run?${params.toString()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
            if (!response.ok) {
                const error = await response.json().catch(() => ({}))
                throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`)
            }
            return response.json() as Promise<ScreenerStatus>
        })
    },

    async getScreenerStatus(market?: string): Promise<ScreenerStatus> {
        // 缓存键按 market 分桶，避免切市场后 2s 内命中旧市场的 running/idle 状态。
        const _market = market ?? 'US'
        const cacheKey = `screener:status:${_market}`
        const cached = requestCache.get<ScreenerStatus>(cacheKey)
        if (cached) return cached

        const params = new URLSearchParams()
        if (market) params.set('market', market)
        const url = `${API_BASE}/screener/status?${params.toString()}`
        const response = await fetch(url)
        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`)
        }
        const data: ScreenerStatus = await response.json()
        // Only cache running/idle states; completed/error must always be fresh
        if (data.status === 'running' || data.status === 'idle') {
            requestCache.set(cacheKey, data, 2_000)
        }
        return data
    },

    async getStrategies(): Promise<{ strategies: StrategySpec[] }> {
        const cached = requestCache.get<{ strategies: StrategySpec[] }>('strategies')
        if (cached) return cached

        const response = await fetch(`${API_BASE}/strategies`)
        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`)
        }
        const data: { strategies: StrategySpec[] } = await response.json()
        requestCache.set('strategies', data, 5 * 60_000)
        return data
    },



    async healthCheck() {
        const response = await fetch(`${API_BASE}/health`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    },

    async getTickerData(symbol: string, lookback: number = 756, market?: string) {
        // market 必须透传：后端按 market 创建 MarketContext 选择 provider，
        // 不传则回落到 settings.market（默认 US），CN ticker 会拉不到数据。
        const params = new URLSearchParams({ lookback: String(lookback) });
        if (market) params.set("market", market);
        const response = await fetch(`${API_BASE}/data/ticker/${symbol}?${params.toString()}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `Failed to fetch data for ${symbol}`);
        }
        return response.json();
    },

    async runMarketSync(market: string): Promise<any> {
        const response = await fetch(`${API_BASE}/admin/sync/market?market=${market}`, { method: 'POST' });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    },

    async runOptionsSync(): Promise<any> {
        const response = await fetch(`${API_BASE}/admin/sync/options`, { method: 'POST' });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    },

    async runIntradaySync(): Promise<any> {
        const response = await fetch(`${API_BASE}/admin/sync/intraday`, { method: 'POST' });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    },

    async getSyncStatus(): Promise<FullSyncStatus> {
        const response = await fetch(`${API_BASE}/admin/sync/status`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    },

    async reloadCaches(): Promise<any> {
        requestCache.clear();
        const response = await fetch(`${API_BASE}/admin/reload`, { method: 'POST' });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    },

    async getOptimizationHistory(market?: string): Promise<OptimizationHistoryRecord[]> {
        const params = new URLSearchParams();
        if (market) params.set('market', market);
        const qs = params.toString();
        const response = await fetch(`${API_BASE}/backtest/optimize/history${qs ? `?${qs}` : ''}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Failed to fetch history');
        }
        return response.json();
    },

    async saveOptimizationHistory(data: Partial<OptimizationHistoryRecord>): Promise<{ id: string }> {
        const response = await fetch(`${API_BASE}/backtest/optimize/history/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Failed to save history');
        }
        return response.json();
    },

    async deleteOptimizationHistory(recordId: string): Promise<void> {
        const response = await fetch(`${API_BASE}/backtest/optimize/history/${recordId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Failed to delete history');
        }
    },

    async getSignals(strategyId: string = 'ULTIMATE_COMBINED', market?: string): Promise<SignalResult> {
        const params = new URLSearchParams({ strategy_id: strategyId });
        if (market) params.set('market', market);
        const response = await fetch(`${API_BASE}/signals/latest?${params.toString()}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Failed to fetch signals');
        }
        return normalizeSignalResult(await response.json());
    },

    async getLiveSignals(strategyId: string = 'ADAPTIVE_MOMENTUM', forceSync: boolean = true, params: Record<string, any> = {}, market?: string): Promise<SignalResult> {
        const response = await fetch(`${API_BASE}/signals/live`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strategy_id: strategyId, force_sync: forceSync, params, market }),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Live signal generation failed');
        }
        return normalizeSignalResult(await response.json());
    },

    async getLivePulse(symbols: string[], market?: string): Promise<{
        ts: string;
        prices: { current: Record<string, number>; prev_close: Record<string, number> };
        enhancements: Record<string, any>;
        market_open: boolean;
        degraded: boolean;
        degraded_reason: string;
    }> {
        const params = new URLSearchParams();
        if (symbols.length > 0) params.set('symbols', symbols.join(','));
        if (market) params.set('market', market);
        const response = await fetch(`${API_BASE}/signals/live/pulse?${params.toString()}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Pulse fetch failed');
        }
        return await response.json();
    },

    async rerunExperiment(experimentId: string, paramOverrides: Record<string, any> = {}): Promise<BacktestResult> {
        const response = await fetch(`${API_BASE}/experiments/${experimentId}/rerun`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ param_overrides: paramOverrides }),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Rerun experiment failed');
        }
        const raw = await response.json();
        return normalizeBacktestResult(raw);
    },

    async getAnalysis(symbol: string, market?: string): Promise<AnalysisResult> {
        const params = new URLSearchParams();
        if (market) params.set('market', market);
        const response = await fetch(`${API_BASE}/analysis/${encodeURIComponent(symbol)}?${params.toString()}`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || `Failed to fetch analysis for ${symbol}`);
        }
        return response.json();
    },

    async getPortfolioSignals(preset?: string, weights?: Record<string, number>, strategyParams?: Record<string, any>, market?: string): Promise<PortfolioSignalResult> {
        const body: Record<string, any> = {};
        if (preset) body.preset = preset;
        if (weights) body.weights = weights;
        if (strategyParams) body.strategy_params = strategyParams;
        if (market) body.market = market;
        const response = await fetch(`${API_BASE}/signals/portfolio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Failed to fetch portfolio signals');
        }
        const raw = await response.json();
        return {
            date: raw?.date ?? '',
            market_status: raw?.market_status ?? 'Unknown',
            portfolio: Array.isArray(raw?.portfolio) ? raw.portfolio : [],
            sub_portfolios: raw?.sub_portfolios ?? {},
            sub_signals: raw?.sub_signals ?? {},
            strategy_weights: raw?.strategy_weights ?? {},
            cash_weight: raw?.cash_weight ?? '0%',
            metadata: raw?.metadata ?? {},
        };
    }
};
