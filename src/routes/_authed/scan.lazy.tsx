import { createLazyFileRoute } from "@tanstack/react-router";
import { Button, Chip } from "@tw-material/react";
import IconMdiAutoFix from "~icons/mdi/auto-fix";
import IconMdiRefresh from "~icons/mdi/refresh";
import IconMdiPlay from "~icons/mdi/play";
import IconMdiStop from "~icons/mdi/stop";
import IconMdiDelete from "~icons/mdi/delete";
import IconMdiPencil from "~icons/mdi/pencil";
import IconMdiTextBoxSearchOutline from "~icons/mdi/text-box-search-outline";
import IconMdiBroom from "~icons/mdi/broom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScanTaskModal } from "@/components/modals/scan-task";
import { $api } from "@/utils/api";
import toast from "react-hot-toast";

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

function ScanRoute() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [logTask, setLogTask] = useState<any>(null);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const { data: tasks, isLoading, refetch } = useQuery({
    ...$api.queryOptions("get", "/scans"),
    refetchInterval: 5000,
  });

  const updateScan = $api.useMutation("patch", "/scans/{id}");
  const deleteScan = $api.useMutation("delete", "/scans/{id}");

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateScan.mutateAsync({
        params: { path: { id } },
        body: { status }
      });
      toast.success(`Task ${status}`);
      refetch();
    } catch (e) {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa task này?")) return;
    try {
      await deleteScan.mutateAsync({
        params: { path: { id } }
      });
      toast.success("Task deleted");
      refetch();
    } catch (e) {
      toast.error("Failed to delete task");
    }
  };

  const handleClearLogs = async (id: string) => {
    try {
      await updateScan.mutateAsync({
        params: { path: { id } },
        body: { status: "clear_logs" },
      });
      toast.success("Logs cleared");
      await refetch();

      // cập nhật task đang mở modal (nếu trùng id)
      setLogTask((prev: any) => (prev?.id === id ? { ...prev, logs: [] } : prev));
    } catch (e) {
      toast.error("Failed to clear logs");
    }
  };

  return (
    <div className="flex h-full flex-col p-4 md:p-8 bg-surface text-on-surface w-full overflow-y-auto">
      <div className="flex flex-row items-center justify-between mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-display-small font-medium">Quét Telegram</h1>
          <p className="text-body-medium text-on-surface-variant">Quản lý các tiến trình quét kênh/nhóm tự động</p>
        </div>
        <div className="flex gap-2">
          <Button variant="text" isIconOnly onPress={() => refetch()} isLoading={isLoading}>
            <IconMdiRefresh className="size-5" />
          </Button>
          <Button variant="filled" className="gap-2" onPress={() => { setEditingTask(null); setIsOpen(true); }}>
            <IconMdiAutoFix className="size-5" />
            <span>Tạo Task Mới</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 w-full">
        {isLoading && !tasks ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-40 bg-surface-container-low border border-outline-variant/30 rounded-3xl" />
            ))}
          </div>
        ) : !tasks?.items || tasks.items.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 h-64 flex flex-col items-center justify-center gap-4 text-on-surface-variant">
            <IconMdiAutoFix className="size-12 opacity-50" />
            <p className="text-body-large">Chưa có task quét nào được tạo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            {tasks.items.map((task: any) => {
              const progress = (task.scannedCount || 0) > 0 ? ((task.importedCount || 0) / task.scannedCount) * 100 : 0;
              return (
                <div key={task.id} className="bg-surface-container-low border border-outline-variant/30 hover:border-primary/50 transition-colors rounded-[28px] p-5 flex flex-col gap-4">
                  <div className="flex flex-row items-start justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs text-on-surface-variant flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-primary/80">Channel :</span>
                          <span className="truncate">
                            {task.channelName ? `${task.channelName} (${task.channelId})` : task.channelId}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-primary/80">Folder :</span>
                          <span className="truncate italic">
                            {task.folderPath ? (task.folderPath.startsWith("/root") ? task.folderPath.slice(5) || "/" : task.folderPath) : "/"}
                          </span>
                        </div>
                        {typeof task.topicId === "number" && task.topicId > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-primary/80">Topic:</span>
                            <span className="truncate">
                              {task.topicName ? `${task.topicName} (${task.topicId})` : task.topicId}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Chip 
                      size="sm" 
                      variant="flat" 
                      color={
                        task.status === "completed" || task.status === "success" ? "success" :
                        task.status === "active" || task.status === "running" ? "primary" :
                        task.status === "scheduled" || task.status === "paused" ? "secondary" :
                        task.status === "failed" || task.status === "error" || task.status === "cancelled" ? "danger" :
                        "default"
                      }
                      className="capitalize"
                    >
                      {task.status}
                    </Chip>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-row justify-between text-label-small">
                      <span>Tiến trình: {task.scannedCount} tin nhắn</span>
                      <span>{task.importedCount} file đã nhập</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-row items-center justify-between text-label-small text-on-surface-variant mt-auto pt-2 border-t border-outline-variant/10">
                    <div className="flex items-center gap-2">
                      <span>{formatDate(task.createdAt)}</span>
                      {task.repeatEnabled && (
                        <Chip size="sm" variant="dot" color="secondary" className="h-5">Định kỳ</Chip>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {task.status === "running" || task.status === "waiting" ? (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="tonal"
                          color="danger"
                          className="h-8 w-8 min-w-0"
                          onPress={() => handleStatusUpdate(task.id, "paused")}
                          isLoading={updateScan.isPending && updateScan.variables?.params?.path?.id === task.id}
                        >
                          <IconMdiStop className="size-4" />
                        </Button>
                      ) : (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="tonal"
                          color="primary"
                          className="h-8 w-8 min-w-0"
                          onPress={() => handleStatusUpdate(task.id, "waiting")}
                          isLoading={updateScan.isPending && updateScan.variables?.params?.path?.id === task.id}
                        >
                          <IconMdiPlay className="size-4" />
                        </Button>
                      )}

                      {/* Nút mở log modal */}
                      <Button
                        isIconOnly
                        size="sm"
                        variant="tonal"
                        color="secondary"
                        className="h-8 w-8 min-w-0"
                        onPress={() => {
                          setLogTask(task);
                          setIsLogOpen(true);
                        }}
                        title="View task logs"
                      >
                        <IconMdiTextBoxSearchOutline className="size-4" />
                      </Button>

                      <Button
                        isIconOnly
                        size="sm"
                        variant="tonal"
                        color="secondary"
                        className="h-8 w-8 min-w-0"
                        onPress={() => {
                          setEditingTask(task);
                          setIsOpen(true);
                        }}
                      >
                        <IconMdiPencil className="size-4" />
                      </Button>

                      <Button
                        isIconOnly
                        size="sm"
                        variant="text"
                        color="primary"
                        className="h-8 w-8 min-w-0 opacity-50 hover:opacity-100"
                        onPress={() => handleDelete(task.id)}
                      >
                        <IconMdiDelete className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LOG MODAL - dán tại đây */}
      {isLogOpen && logTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-surface border border-outline-variant shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant/20">
              <div>
                <h3 className="text-title-medium font-semibold">Task Logs</h3>
                <p className="text-label-small text-on-surface-variant">
                  {logTask.channelName ? `${logTask.channelName} (${logTask.channelId})` : logTask.channelId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="tonal"
                  color="secondary"
                  className="gap-1"
                  onPress={() => handleClearLogs(logTask.id)}
                  isLoading={updateScan.isPending && updateScan.variables?.params?.path?.id === logTask.id}
                >
                  <IconMdiBroom className="size-4" />
                  <span>Clear logs</span>
                </Button>
                <Button size="sm" variant="text" onPress={() => setIsLogOpen(false)}>
                  Đóng
                </Button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-auto p-4">
              {Array.isArray(logTask.logs) && logTask.logs.length > 0 ? (
                <div className="space-y-2">
                  {logTask.logs.map((line: string, idx: number) => (
                    <pre
                      key={idx}
                      className="whitespace-pre-wrap break-words rounded-lg bg-surface-container-low p-2 text-xs text-on-surface"
                    >
                      {line}
                    </pre>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-on-surface-variant">Chưa có log cho task này.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <ScanTaskModal 
        isOpen={isOpen} 
        onOpenChange={setIsOpen} 
        task={editingTask} 
      />
    </div>
  );
}

export const Route = createLazyFileRoute("/_authed/scan")({
  component: ScanRoute,
});
