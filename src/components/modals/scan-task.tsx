import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Switch,
  Select,
  SelectItem,
  Divider,
} from "@tw-material/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { $api } from "@/utils/api";
import toast from "react-hot-toast";
import IconMdiChevronLeft from "~icons/mdi/chevron-left";
import IconMdiChevronRight from "~icons/mdi/chevron-right";
import IconMdiFolderPlus from "~icons/mdi/folder-plus";

interface ScanTaskModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
}

type ScanFormValues = {
  folderId: string;
  channelId: string;
  topicId?: string;
  splitMode: boolean;
  ruleMode: boolean;
  ruleString?: string;
  repeatEnabled: boolean;
  schedule?: string;
};

const FolderCreateButton = ({
  parentId,
  onCreated,
}: {
  parentId: string | null;
  onCreated: (folder: any) => void;
}) => {
  const queryClient = useQueryClient();
  const createFolder = $api.useMutation("post", "/files", {
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["get", "/files"] });
      toast.success("Thư mục đã được tạo");
      onCreated(data);
    },
  });

  const handleCreateFolder = useCallback(async () => {
    const name = window.prompt("Nhập tên thư mục mới:");
    if (!name) return;
    try {
      await createFolder.mutateAsync({
        body: { 
          name, 
          type: "folder", 
          parentId: parentId === "root" ? "" : (parentId || ""),
          path: parentId ? "" : "/"
        },
      });
    } catch (e) {
      toast.error("Không thể tạo thư mục");
    }
  }, [createFolder, parentId]);

  return (
    <Button
      size="sm"
      variant="flat"
      startContent={<IconMdiFolderPlus className="size-4" />}
      onPress={handleCreateFolder}
      className="w-full justify-start"
    >
      Tạo folder mới {parentId ? "trong đây" : ""}
    </Button>
  );
};

const ScheduleSelector = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => {
  const [mode, setMode] = useState<"once" | "preset" | "cron">(() => {
    if (!value) return "once";
    if (value.includes("*") || value.split(" ").length > 1) {
      return "cron";
    }
    return "once";
  });

  const presets = [
    { name: "Mỗi phút", value: "* * * * *" },
    { name: "Mỗi 5 phút", value: "*/5 * * * *" },
    { name: "Mỗi 30 phút", value: "*/30 * * * *" },
    { name: "Hàng giờ", value: "0 * * * *" },
    { name: "Hàng ngày (00:00)", value: "0 0 * * *" },
    { name: "Hàng tuần (Chủ nhật)", value: "0 0 * * 0" },
    { name: "Hàng tháng (Ngày 1)", value: "0 0 1 * *" },
  ];

  const currentMode = useMemo(() => {
    if (mode === "preset" && !presets.some((p) => p.value === value)) {
       return "cron";
    }
    return mode;
  }, [mode, value]);

  return (
    <div className="flex flex-col gap-4 p-4 rounded-2xl bg-surface-container-low/30 border border-outline-variant/10">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-primary/80 uppercase tracking-wider px-1">Chế độ lặp lại</label>
        <div className="flex p-1 bg-surface-container-high rounded-xl gap-1">
          <Button
            size="sm"
            variant={currentMode === "once" ? "flat" : "text"}
            onPress={() => setMode("once")}
            className={`flex-1 h-8 text-[11px] font-bold rounded-lg transition-all ${currentMode === "once" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant hover:bg-surface/50"}`}
          >
            Một lần
          </Button>
          <Button
            size="sm"
            variant={currentMode === "preset" ? "flat" : "text"}
            onPress={() => {
                setMode("preset");
                if (!presets.some(p => p.value === value)) {
                    onChange(presets[3].value); // Default to hourly
                }
            }}
            className={`flex-1 h-8 text-[11px] font-bold rounded-lg transition-all ${currentMode === "preset" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant hover:bg-surface/50"}`}
          >
            Nhanh
          </Button>
          <Button
            size="sm"
            variant={currentMode === "cron" ? "flat" : "text"}
            onPress={() => setMode("cron")}
            className={`flex-1 h-8 text-[11px] font-bold rounded-lg transition-all ${currentMode === "cron" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant hover:bg-surface/50"}`}
          >
            Cron
          </Button>
        </div>
      </div>

      <div className="mt-1">
        {currentMode === "once" && (
          <Input
            type="datetime-local"
            label="Thời gian bắt đầu"
            placeholder=" "
            variant="bordered"
            defaultValue={value?.includes("*") ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            className="text-xs"
          />
        )}

        {currentMode === "preset" && (
          <Select
            label="Chọn chu kỳ lặp lại"
            variant="bordered"
            selectedKeys={new Set([value])}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;
              onChange(val);
            }}
            className="text-xs font-medium"
          >
            {presets.map((p) => (
              <SelectItem key={p.value} textValue={p.name}>
                {p.name}
              </SelectItem>
            ))}
          </Select>
        )}

        {currentMode === "cron" && (
          <div className="space-y-2">
            <Input
              label="Biểu thức Cron"
              placeholder="Ví dụ: 0 12 * * *"
              variant="bordered"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="font-mono text-xs"
            />
            <div className="bg-primary/5 p-2 rounded-lg border border-primary/10">
                <p className="text-[10px] text-primary/80 leading-relaxed italic">
                    Định dạng: Phút Giờ Ngày Tháng Thứ. <br/>
                    Ví dụ: <span className="font-bold underline">0 12 * * *</span> chạy lúc 12:00 trưa mỗi ngày.
                </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export function ScanTaskModal({ isOpen, onOpenChange, task }: ScanTaskModalProps) {
  const queryClient = useQueryClient();
  const { control, handleSubmit, watch, setValue, reset } = useForm<ScanFormValues>({
    defaultValues: {
      folderId: "",
      channelId: "",
      splitMode: false,
      ruleMode: false,
      repeatEnabled: false,
    },
  });

  const [parentId, setParentId] = useState<string | null>(null);
  const [pathStack, setPathStack] = useState<{id: string, name: string}[]>([]);
  const [selectedChannelName, setSelectedChannelName] = useState("");
  const [selectedTopicName, setSelectedTopicName] = useState("");
  const [customFolder, setCustomFolder] = useState(false);
  const [customChannel, setCustomChannel] = useState(false);
  const [customTopic, setCustomTopic] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (task) {
        reset({
          folderId: task.folderId || "",
          channelId: task.channelId?.toString() || "",
          topicId: task.topicId?.toString() || "",
          splitMode: !!task.splitMode,
          ruleMode: !!task.ruleMode,
          ruleString: task.ruleString || "",
          repeatEnabled: !!task.repeatEnabled,
          schedule: task.schedule || "",
        });
        setParentId(task.folderId || null);
        setSelectedChannelName(task.channelName || "");
        setSelectedTopicName(task.topicName || "");
      } else {
        reset({
          folderId: "",
          channelId: "",
          splitMode: false,
          ruleMode: false,
          repeatEnabled: false,
        });
        setParentId(null);
        setSelectedChannelName("");
        setSelectedTopicName("");
      }
    }
  }, [isOpen, task, reset]);

  // Queries
  const { data: folderData, isLoading: foldersLoading } = useQuery({
    ...$api.queryOptions("get", "/files", {
      params: { 
        query: { 
          view: "my-drive", 
          type: "folder", 
          limit: 200,
          parentId: parentId || undefined,
          path: parentId ? undefined : "/"
        } as any 
      }
    }),
  });

  const { data: parentFolder } = useQuery({
    ...$api.queryOptions("get", "/files/{id}", { params: { path: { id: parentId || "" } } }),
    enabled: !!parentId && parentId !== "root",
  });

  const { data: channelData, isLoading: channelsLoading } = useQuery($api.queryOptions("get", "/users/channels"));
  
  const selectedChannelId = watch("channelId");
  const { data: topicData, isLoading: topicsLoading } = useQuery({
    ...$api.queryOptions("get", "/users/channels/{id}/topics", { 
      params: { path: { id: selectedChannelId?.startsWith("-100") ? selectedChannelId.slice(4) : selectedChannelId } } 
    }),
    enabled: !!selectedChannelId && !customChannel,
  });

  const selectedChannelNameMeta = useMemo(() => {
    if (!selectedChannelId) return "";
    const chan = (channelData || []).find((c: any) => c.channelId?.toString() === selectedChannelId || c.channelId?.toString() === "-100"+selectedChannelId);
    return chan?.channelName || "";
  }, [selectedChannelId, channelData]);

  const selectedTopicId = watch("topicId");
  const selectedTopicNameMeta = useMemo(() => {
    if (!selectedTopicId) return "";
    const topic = (topicData || []).find((t: any) => t.id?.toString() === selectedTopicId);
    return topic?.name || "";
  }, [selectedTopicId, topicData]);

  const createScan = $api.useMutation("post", "/scans");
  const updateScan = $api.useMutation("patch", "/scans/{id}");

  const onSubmit = useCallback(async (values: ScanFormValues, startImmediately = false) => {
    let chanIdStr = values.channelId;
    if (!chanIdStr) {
      toast.error("Channel ID là bắt buộc");
      return;
    }
    
    if (chanIdStr.startsWith("-100")) chanIdStr = chanIdStr.slice(4);
    const chanId = Number(chanIdStr);
    
    if (isNaN(chanId)) {
      toast.error("Channel ID không hợp lệ");
      return;
    }

    const fid = (values.folderId === "root" || !values.folderId || values.folderId === "") ? "" : values.folderId;
    
    try {
      let res;
      const body = {
        folderId: fid,
        channelId: chanId,
        channelName: selectedChannelNameMeta || selectedChannelName,
        topicId: values.topicId ? Number(values.topicId) : undefined,
        topicName: selectedTopicNameMeta || selectedTopicName,
        splitMode: values.splitMode,
        ruleMode: values.ruleMode,
        ruleString: values.ruleString,
        repeatEnabled: values.repeatEnabled,
        schedule: values.schedule,
      };

      if (task?.id) {
        res = await updateScan.mutateAsync({
          params: { path: { id: task.id } },
          body: body as any
        });
      } else {
        res = await createScan.mutateAsync({
          body: {
            ...body,
            status: startImmediately ? "waiting" : "paused"
          } as any
        });
      }

      if (startImmediately && (res || task)) {
        await updateScan.mutateAsync({
          params: { path: { id: (res as any)?.id || task.id } },
          body: { status: "running" }
        });
        toast.success("Task started successfully");
      } else {
        toast.success(task ? "Task updated successfully" : "Task saved successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["get", "/scans"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save task");
    }
  }, [createScan, updateScan, queryClient, task]);

  const splitMode = watch("splitMode");
  const ruleMode = watch("ruleMode");
  const repeatEnabled = watch("repeatEnabled");

  const folders = [
    { id: "", name: "Thư mục gốc (Drive)" },
    ...(folderData?.items || []).filter((f: any) => f.type === "folder")
  ];

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="3xl"
      isDismissable={false}
      scrollBehavior="inside"
    >
      <ModalContent className="bg-surface text-on-surface">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-on-surface border-b border-outline-variant/30">
              {task ? "Chỉnh Sửa Task Quét" : "Tạo Task Quét Telegram"} (v1.2-FORCE-LOCAL)
            </ModalHeader>
            <ModalBody className="py-6">
              <form id="scan-task-form" onSubmit={handleSubmit((v) => onSubmit(v, false))} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Thư mục đích</label>
                    <Button
                      size="sm"
                      variant="text"
                      onPress={() => setCustomFolder(!customFolder)}
                      className="text-primary h-7 min-w-0 px-2"
                    >
                      {customFolder ? "Chọn từ danh sách" : "Nhập ID/Path thủ công"}
                    </Button>
                  </div>

                  {customFolder ? (
                    <Controller
                      name="folderId"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="Folder Path or ID"
                          variant="bordered"
                          placeholder="Ví dụ: /MyFolder/Sub hoặc UUID"
                          description="Nhập đường dẫn bắt đầu bằng / hoặc ID thư mục"
                        />
                      )}
                    />
                  ) : (
                    <div className="space-y-3">
                      {/* Navigation Header */}
                      <div className="flex items-center gap-2 p-2 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="text"
                          onPress={() => {
                            const newStack = [...pathStack];
                            newStack.pop();
                            setPathStack(newStack);
                            setParentId(newStack.length > 0 ? newStack[newStack.length - 1].id : null);
                          }}
                          className="h-8 w-8 min-w-0"
                        >
                          <IconMdiChevronLeft className="size-5" />
                        </Button>
                        <div className="flex-1 flex items-center gap-1 overflow-hidden">
                          <span 
                            className="text-[10px] font-bold text-primary cursor-pointer hover:underline"
                            onClick={() => {
                              setParentId(null);
                              setPathStack([]);
                            }}
                          >
                            My Drive
                          </span>
                          {pathStack.length > 0 && (
                            <>
                              <span className="text-on-surface-variant/30 text-[10px]">/</span>
                              <span className="text-[10px] font-medium truncate text-on-surface-variant">
                                {pathStack[pathStack.length - 1].name}
                              </span>
                            </>
                          )}
                        </div>
                        <FolderCreateButton 
                          parentId={watch("folderId") || parentId} 
                          onCreated={(f) => {
                            const currentSelection = watch("folderId") || parentId;
                            const newStack = [...pathStack];
                            
                            // If we created inside a subfolder that is visible in current list but not "entered"
                            if (currentSelection && currentSelection !== parentId) {
                              const selFolder = (folderData?.items || []).find((item: any) => item.id === currentSelection);
                              if (selFolder) {
                                newStack.push({ id: selFolder.id, name: selFolder.name });
                              }
                            }
                            
                            setParentId(f.id);
                            setValue("folderId", f.id);
                            setPathStack([...newStack, { id: f.id, name: f.name }]);
                          }} 
                        />
                      </div>

                      {/* Folder List */}
                      <div className="h-48 overflow-y-auto border border-outline-variant/30 rounded-xl p-1 bg-surface-container-lowest divide-y divide-outline-variant/10">
                        <div 
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${watch("folderId") === (parentId || "") ? "bg-primary/10 text-primary" : "hover:bg-surface-container-low"}`}
                          onClick={() => setValue("folderId", parentId || "")}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${watch("folderId") === (parentId || "") ? 'bg-primary' : 'bg-transparent'}`} />
                          <span className="text-xs font-medium italic">. (Chọn thư mục này: {pathStack.length > 0 ? "/" + pathStack.map(p => p.name).join("/") : (task?.folderPath || "/")})</span>
                        </div>

                        {foldersLoading ? (
                          <div className="p-4 text-center text-xs animate-pulse italic">Đang tải...</div>
                        ) : (folderData?.items || []).filter((f: any) => f.type?.toLowerCase() === "folder").length === 0 ? (
                          <div className="p-4 text-center text-xs text-on-surface-variant/50">Thư mục trống</div>
                        ) : (folderData?.items || [])
                          .filter((f: any) => f.type?.toLowerCase() === "folder")
                          .map((folder: any) => (
                            <div 
                              key={folder.id}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer group transition-all ${
                                watch("folderId") === folder.id ? "bg-primary/10 text-primary" : "hover:bg-surface-container-low"
                              }`}
                              onClick={() => setValue("folderId", folder.id)}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${watch("folderId") === folder.id ? 'bg-primary' : 'bg-transparent'}`} />
                              <div className="flex-1 truncate text-xs font-medium">{folder.name}</div>
                              <Button 
                                isIconOnly 
                                size="sm" 
                                variant="text" 
                                className="h-6 w-6 min-w-0 text-on-surface-variant/50 group-hover:text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setParentId(folder.id);
                                  setPathStack([...pathStack, { id: folder.id, name: folder.name }]);
                                }}
                              >
                                <IconMdiChevronRight className="size-4" />
                              </Button>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>

                {/* Channel Selection */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Kênh / Nhóm nguồn</span>
                  <div className="flex flex-row gap-3">
                    <Controller
                      name="channelId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          placeholder="Chọn kênh có sẵn..."
                          variant="bordered"
                          isLoading={channelsLoading}
                          selectedKeys={field.value ? new Set([field.value]) : new Set()}
                          onSelectionChange={(keys) => {
                            const val = Array.from(keys)[0] as string;
                            field.onChange(val);
                            setValue("topicId", ""); 
                            const chan = (channelData || []).find((c: any) => c.channelId?.toString() === val);
                            if (chan) setSelectedChannelName(chan.channelName);
                          }}
                          className="flex-[2]"
                        >
                          {(channelData || []).map((c: any) => (
                            <SelectItem key={c.channelId?.toString()} textValue={c.channelName}>
                              {c.channelName} ({c.channelId})
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />
                    <Controller
                      name="channelId"
                      control={control}
                      render={({ field }) => (
                        <Input 
                          {...field} 
                          placeholder="ID (-100...)" 
                          variant="bordered" 
                          className="flex-1 text-center"
                          onChange={(e) => {
                            field.onChange(e);
                            setSelectedChannelName(`Channel ${e.target.value}`); // Fallback
                          }}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Topic Selection */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Topic (Forum)</span>
                  <div className="flex flex-row gap-3">
                    <Controller
                      name="topicId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          placeholder="Chọn topic..."
                          variant="bordered"
                          isLoading={topicsLoading}
                          isDisabled={!selectedChannelId || selectedChannelId === ""}
                          selectedKeys={field.value ? new Set([field.value]) : new Set()}
                          onSelectionChange={(keys) => {
                            const val = Array.from(keys)[0] as string;
                            field.onChange(val);
                            const topic = (topicData || []).find((t: any) => t.id?.toString() === val);
                            if (topic) setSelectedTopicName(topic.name);
                          }}
                          className="flex-[2]"
                        >
                          {(topicData || []).map((t: any) => (
                            <SelectItem key={t.id?.toString()} textValue={t.name}>{t.name}</SelectItem>
                          ))}
                        </Select>
                      )}
                    />
                    <Controller
                      name="topicId"
                      control={control}
                      render={({ field }) => (
                        <Input 
                          {...field} 
                          placeholder="ID Topic" 
                          variant="bordered" 
                          className="flex-1 text-center" 
                          onChange={(e) => {
                            field.onChange(e);
                            setSelectedTopicName(`Topic ${e.target.value}`); // Fallback
                          }}
                        />
                      )}
                    />
                  </div>
                </div>

                <Divider className="opacity-30" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-row items-center justify-between p-3 rounded-2xl bg-surface-container-low/50 border border-outline-variant/20">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Split Mode</span>
                        <span className="text-xs text-on-surface-variant">Tự phân loại vào subfolders</span>
                      </div>
                      <Controller
                        name="splitMode"
                        control={control}
                        render={({ field }) => (
                          <Switch isSelected={field.value} onValueChange={field.onChange} />
                        )}
                      />
                    </div>

                    <div className="flex flex-row items-center justify-between p-3 rounded-2xl bg-surface-container-low/50 border border-outline-variant/20">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Rule Filter</span>
                        <span className="text-xs text-on-surface-variant">Chỉ lấy các file theo rule</span>
                      </div>
                      <Controller
                        name="ruleMode"
                        control={control}
                        render={({ field }) => (
                          <Switch isSelected={field.value} onValueChange={field.onChange} />
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-row items-center justify-between p-3 rounded-2xl bg-surface-container-low/50 border border-outline-variant/20">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Repeat Task</span>
                        <span className="text-xs text-on-surface-variant">Tự động quét định kỳ</span>
                      </div>
                      <Controller
                        name="repeatEnabled"
                        control={control}
                        render={({ field }) => (
                          <Switch isSelected={field.value} onValueChange={field.onChange} />
                        )}
                      />
                    </div>
                  </div>
                </div>

                {ruleMode && (
                  <div className="space-y-1">
                    <Controller
                      name="ruleString"
                      control={control}
                      render={({ field }) => (
                        <Input 
                          {...field} 
                          label="Quy tắc (Extension mapping)" 
                          placeholder="Ví dụ: prc:PRC,epub:EPUB,mobi:PRC" 
                          variant="bordered" 
                        />
                      )}
                    />
                    <p className="text-[10px] text-on-surface-variant/70 px-1 italic">
                      Định dạng: ext1:folder1,ext2:folder2. File sẽ được đưa vào subfolder tương ứng.
                    </p>
                  </div>
                )}

                {repeatEnabled && (
                  <Controller
                    name="schedule"
                    control={control}
                    render={({ field }) => (
                      <ScheduleSelector value={field.value || ""} onChange={field.onChange} />
                    )}
                  />
                )}
              </form>
            </ModalBody>
            <ModalFooter className="border-t border-outline-variant/30 px-6 py-4">
              <Button color="secondary" variant="text" onPress={() => { onClose(); reset(); }}>
                Đóng
              </Button>
              <div className="flex-1" />
              <Button 
                color="primary" 
                variant="filledTonal" 
                type="submit" 
                form="scan-task-form"
                isLoading={createScan.isPending || updateScan.isPending}
                className="px-6"
              >
                Lưu Task
              </Button>
              <Button 
                color="primary" 
                variant="filled"
                onPress={handleSubmit((v) => onSubmit(v, true))}
                isLoading={createScan.isPending || updateScan.isPending}
                className="px-6"
              >
                Chạy Ngay
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>

  );
}
