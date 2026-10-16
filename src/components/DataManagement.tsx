import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api, type FullSyncStatus, type SyncTaskStatus } from '@/lib/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Database, Zap, CircleDot, AlertCircle, RefreshCw, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useMarket } from '@/contexts/MarketContext';
import { useMarketScope } from '@/hooks/useMarketScope';
import { usePolling } from '@/hooks/usePolling';

/** 已耗时秒数（每秒跳动；startedAt 缺失返回 null） */
function useElapsedSeconds(startedAt?: string): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) return null;
  return Math.max(0, Math.floor((now - start) / 1000));
}

const PHASE_LABELS: Record<string, string> = {
  downloading: '下载中',
  rate_limited: '限流等待',
  validating: '校验中',
  writing: '写入中',
};

/** DEGRADED 原因码映射（中文文案 + 保留原始码） */
const REASON_CODE_LABELS: Record<string, string> = {
  WESTOCK_SERVICE_ERROR: '服务错误',
  RATE_LIMITED: '限流',
  PARTIAL_DATA: '部分数据已写入',
  WORKER_ERROR: '部分 worker 失败',
};

const IDLE_SYNC_TASK: SyncTaskStatus = { status: 'idle' };

/** 降级判定：显式 DEGRADED 状态或 degraded 标记（completed + degraded 也按降级展示） */
function isDegradedTask(s: SyncTaskStatus): boolean {
  return s.status === 'DEGRADED' || s.degraded === true;
}

/** 文案经 props 注入（提取原则：公共区不得依赖 @/private），调用方传 translations[lang] */
export interface DataManagementStrings {
  idle: string; running: string; completed: string; error: string;
  processing: string; last_success: string; run_scan: string;
  data_management: string; reload_data: string; scorer_desc: string;
  grab_data: string; market_sync_desc: string;
  grab_option_data: string; options_sync_desc: string;
  grab_intraday_data: string; intraday_sync_desc: string;
}

interface DataManagementProps {
  t: DataManagementStrings;
}

export const DataManagement: React.FC<DataManagementProps> = ({ t }) => {
  const { market } = useMarket();
  const scope = useMarketScope(market);
  const [status, setStatus] = useState<FullSyncStatus | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [syncError, setSyncError] = useState<string | null>(null);
  // 跟踪上次 market sync 状态，检测 running → completed/error 转换。
  // 后端 /admin/sync/status 是全局任务：跨市场写回由 scope.alive 拦截，
  // 这里只需记前一个状态（同市场语义由 scope 保证）。
  const prevStatusRef = useRef<string | undefined>(undefined);

  // Hook 必须在父组件顶层无条件调用；renderTaskCard 的数量会随市场变化，
  // 不能在那里调用 useElapsedSeconds，否则 CN(1 卡) → US(3 卡) 会改变 Hook 顺序。
  const marketTask = status?.market ?? IDLE_SYNC_TASK;
  const optionsTask = status?.options ?? IDLE_SYNC_TASK;
  const intradayTask = status?.intraday ?? IDLE_SYNC_TASK;
  const marketElapsed = useElapsedSeconds(
    marketTask.status === 'running' || actionLoading.market ? marketTask.started_at : undefined
  );
  const optionsElapsed = useElapsedSeconds(
    optionsTask.status === 'running' || actionLoading.options ? optionsTask.started_at : undefined
  );
  const intradayElapsed = useElapsedSeconds(
    intradayTask.status === 'running' || actionLoading.intraday ? intradayTask.started_at : undefined
  );

  const fetchStatus = useCallback(async () => {
    const gen = scope.claim()
    try {
      const data = await api.getSyncStatus();
      if (!scope.alive(gen)) return
      setStatus(data);
      // 检测 market sync 完成：running → completed/error/DEGRADED
      const cur = data?.market?.status;
      const curDegraded = data?.market?.degraded === true;
      const prev = prevStatusRef.current;
      if (prev === 'running' && (cur === 'completed' || cur === 'error' || cur === 'DEGRADED' || curDegraded)) {
        // 通知数据健康中心失效缓存并 refetch（sync 后统计已变）
        window.dispatchEvent(new CustomEvent('data:sync-complete', { detail: { market } }));
      }
      prevStatusRef.current = cur;
    } catch (error) {
      console.error('Failed to fetch sync status', error);
    } finally {
      // Done fetching
    }
  }, [market, scope]);

  // 每 5s 轮询同步状态（页面 hidden 时暂停）—— 首次立即拉取
  useEffect(() => { fetchStatus() }, [fetchStatus])
  usePolling(fetchStatus, 5000)

  const handleSync = async (type: 'market' | 'options' | 'intraday') => {
    setSyncError(null);
    setActionLoading(prev => ({ ...prev, [type]: true }));
    try {
      if (type === 'market') await api.runMarketSync(market);
      if (type === 'options') await api.runOptionsSync();
      if (type === 'intraday') await api.runIntradaySync();
      await fetchStatus();
    } catch (error) {
      console.error(`Failed to trigger ${type} sync`, error);
      setSyncError(`${type} sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleReload = async () => {
    setSyncError(null);
    setActionLoading(prev => ({ ...prev, 'reload': true }));
    try {
      const result = await api.reloadCaches();
      // 回显重载结果（market/tickers/rows），确认新数据真的进来了
      if (result?.tickers != null) {
        console.info(`Data reloaded (${result.market}): ${result.tickers} tickers, ${result.rows} rows`);
      }
      await fetchStatus();
    } catch (error) {
      console.error('Failed to reload caches', error);
      setSyncError(`Reload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, 'reload': false }));
    }
  };

  const getStatusBadge = (s: SyncTaskStatus) => {
    // 降级（DEGRADED / degraded=true）统一走 amber 黄色警示，不用 emerald 绿色
    if (isDegradedTask(s)) {
      return <Badge variant="outline" className={cn("text-2xs font-bold uppercase trekking-tighter", "bg-amber-500/10 text-amber-500 border-amber-500/20")}>{t.completed}</Badge>;
    }
    const statusMap = {
      idle: { label: t.idle, className: "bg-secondary text-secondary-foreground" },
      running: { label: t.running, className: "bg-primary/20 text-primary animate-pulse" },
      completed: { label: t.completed, className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
      error: { label: t.error, className: "bg-red-500/10 text-red-500 border-red-500/20" }
    };
    const config = statusMap[s.status as keyof typeof statusMap] || statusMap.idle;
    return <Badge variant="outline" className={cn("text-2xs font-bold uppercase trekking-tighter", config.className)}>{config.label}</Badge>;
  };

  const renderTaskCard = (
    type: 'market' | 'options' | 'intraday',
    title: string,
    description: string,
    icon: React.ReactNode,
    elapsed: number | null
  ) => {
    const taskStatus = status?.[type] || IDLE_SYNC_TASK;
    const isRunning = taskStatus.status === 'running' || actionLoading[type];
    const progress = taskStatus.total && taskStatus.total > 0
      ? Math.round((taskStatus.progress || 0) / taskStatus.total * 100)
      : 0;
    const phaseLabel = isRunning && taskStatus.phase ? PHASE_LABELS[taskStatus.phase] : undefined;
    const rateLimited = taskStatus.phase === 'rate_limited';

    return (
      <Card className="border-border/60 bg-card/40 backdrop-blur-sm hover:border-primary/30 transition-colors duration-snap ease-snap group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 group-hover:scale-[1.05] transition-transform duration-move ease-spring">
                {icon}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-sm">
                  {description}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(taskStatus)}
            </div>
          </div>

          {isRunning && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-2xs font-bold uppercase tracking-widest text-primary/70">
                <span className={cn(rateLimited && "text-amber-500")}>
                  {rateLimited
                    ? (taskStatus.phase_detail || phaseLabel || t.processing)
                    : (phaseLabel || t.processing)}
                </span>
                <span className="flex items-center gap-3">
                  {elapsed !== null && (
                    <span className="flex items-center gap-1 font-mono normal-case">
                      <Timer className="h-3 w-3" />
                      {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
                    </span>
                  )}
                  <span>{progress}% ({taskStatus.progress} / {taskStatus.total})</span>
                </span>
              </div>
              <Progress
                value={progress}
                className={cn("h-1.5", rateLimited ? "bg-amber-500/10" : "bg-primary/10")}
              />
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-6">
            <div className="space-y-1">
              {taskStatus.last_run && (
                <div className="flex items-center gap-2 text-2xs text-muted-foreground">
                  <span className="font-bold uppercase tracking-widest opacity-50">{t.last_success}:</span>
                  <span className="font-mono">{format(new Date(taskStatus.last_run), 'yyyy-MM-dd HH:mm:ss')}</span>
                </div>
              )}
              {taskStatus.error && (
                <div className="text-2xs text-red-500 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {taskStatus.error}
                </div>
              )}
              {taskStatus.reason_code && (
                <div
                  className="text-2xs text-amber-500 font-medium flex items-center gap-1"
                  title={taskStatus.reason_code}
                >
                  <AlertCircle className="h-3 w-3" />
                  {REASON_CODE_LABELS[taskStatus.reason_code] ?? taskStatus.reason_code} ({taskStatus.reason_code})
                </div>
              )}
              {taskStatus.should_reload === true && (
                <div className="text-2xs text-amber-500/80 font-medium">
                  增量已重载
                </div>
              )}
              {taskStatus.data && taskStatus.data.total && (
                <div className="text-2xs text-emerald-500/80 font-bold uppercase tracking-widest">
                  Success: {
                    taskStatus.data.processed
                    ?? taskStatus.data.valid
                    ?? ((taskStatus.data.network_fetched ?? 0) + (taskStatus.data.fresh_skipped ?? 0))
                  } / {taskStatus.data.total}
                  {taskStatus.data.elapsed_seconds != null && (
                    <span className="ml-2 font-mono normal-case opacity-70">
                      {taskStatus.data.elapsed_seconds}s
                    </span>
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={() => handleSync(type)}
              disabled={isRunning}
              variant={isRunning ? "secondary" : "default"}
              className={cn(
                "h-10 px-6 rounded-xl font-bold gap-2",
                !isRunning && "shadow-lg shadow-primary/20 hover:shadow-primary/40"
              )}
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {isRunning ? t.running : t.run_scan}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black tracking-tight text-foreground/90">{t.data_management}</h2>
          <Button 
            onClick={handleReload} 
            disabled={actionLoading['reload']}
            variant="outline"
            className="flex items-center gap-2 border-primary/20 hover:bg-primary/10 text-primary"
          >
            {actionLoading['reload'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {t.reload_data}
          </Button>
        </div>
        <p className="text-muted-foreground text-sm max-w-2xl">{t.scorer_desc}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
        {renderTaskCard(
          'market',
          t.grab_data,
          t.market_sync_desc,
          <Database className="h-6 w-6 text-primary" />,
          marketElapsed
        )}
        {/* CN 市场不支持期权/盘中快照（supports_options_metrics / supports_intraday_snapshot 均为 false），隐藏对应同步入口 */}
        {market !== 'CN' && renderTaskCard(
          'options',
          t.grab_option_data,
          t.options_sync_desc,
          <CircleDot className="h-6 w-6 text-primary" />,
          optionsElapsed
        )}
        {market !== 'CN' && renderTaskCard(
          'intraday',
          t.grab_intraday_data,
          t.intraday_sync_desc,
          <Zap className="h-6 w-6 text-primary" />,
          intradayElapsed
        )}
        {syncError && (
          <div className="text-sm text-red-500 font-medium flex items-center gap-2 px-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {syncError}
          </div>
        )}
      </div>
    </div>
  );
};
