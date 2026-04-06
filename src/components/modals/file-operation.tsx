import { memo, useCallback, useEffect, useState } from "react";
import { FbActions } from "@tw-material/file-browser";
import {
  Button,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
  Select,
  SelectItem,
} from "@tw-material/react";
import { useShallow } from "zustand/react/shallow";

import { useModalStore } from "@/utils/stores";
import { Controller, useForm } from "react-hook-form";
import { CustomActions } from "@/hooks/use-file-action";
import { CopyButton } from "@/components/copy-button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import IcRoundClose from "~icons/ic/round-close";
import { getNextDate, mediaUrl, sharedMediaUrl } from "@/utils/common";
import ShowPasswordIcon from "~icons/mdi/eye-outline";
import HidePasswordIcon from "~icons/mdi/eye-off-outline";
import MdiProtectedOutline from "~icons/mdi/protected-outline";
import { $api } from "@/utils/api";
import { useSearch } from "@tanstack/react-router";
import { useSession } from "@/utils/query-options";

type FileModalProps = {
  queryKey: any;
};

interface RenameDialogProps {
  queryKey: any;
  handleClose: () => void;
}

const RenameDialog = memo(({ queryKey, handleClose }: RenameDialogProps) => {
  const queryClient = useQueryClient();
  const updateFiles = $api.useMutation("patch", "/files/{id}", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
  const { currentFile, actions } = useModalStore(
    useShallow((state) => ({
      currentFile: state.currentFile,
      actions: state.actions,
    })),
  );

  const onRename = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();
      updateFiles
        .mutateAsync({
          params: {
            path: {
              id: currentFile.id,
            },
          },
          body: {
            name: currentFile?.name,
          },
        })
        .then(handleClose);
    },
    [currentFile.name, currentFile.id],
  );

  return (
    <>
      <ModalHeader className="flex flex-col gap-1">Rename</ModalHeader>
      <ModalBody as="form" id="rename-form" onSubmit={onRename}>
        <Input
          size="lg"
          variant="bordered"
          classNames={{
            inputWrapper: "border-primary border-large",
          }}
          autoFocus
          value={currentFile.name}
          onValueChange={(value) => actions.setCurrentFile({ ...currentFile, name: value })}
        />
      </ModalBody>
      <ModalFooter>
        <Button className="font-normal" variant="text" onPress={handleClose}>
          Close
        </Button>
        <Button
          type="submit"
          className="font-normal"
          variant="filledTonal"
          form="rename-form"
          isDisabled={updateFiles.isPending || !currentFile.name}
          isLoading={updateFiles.isPending}
        >
          Rename
        </Button>
      </ModalFooter>
    </>
  );
});

interface FolderCreateDialogProps {
  queryKey: any;
  handleClose: () => void;
}

const FolderCreateDialog = memo(({ queryKey, handleClose }: FolderCreateDialogProps) => {
  const queryClient = useQueryClient();

  const { path } = useSearch({ from: "/_authed/$view" });

  const createFolder = $api.useMutation("post", "/files", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
  const { currentFile, actions } = useModalStore(
    useShallow((state) => ({
      currentFile: state.currentFile,
      actions: state.actions,
    })),
  );

  const onCreate = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      e.preventDefault();
      createFolder
        .mutateAsync({
          body: {
            name: currentFile.name,
            type: "folder",
            path: path ? path : "/",
          },
        })
        .then(() => handleClose());
    },
    [currentFile.name],
  );

  return (
    <>
      <ModalHeader className="flex flex-col gap-1">Create Folder</ModalHeader>
      <ModalBody as="form" id="create-folder-form" onSubmit={onCreate}>
        <Input
          size="lg"
          variant="bordered"
          classNames={{
            inputWrapper: "border-primary border-large",
          }}
          placeholder="Folder Name or Path"
          autoFocus
          value={currentFile?.name}
          onValueChange={(value) => actions.setCurrentFile({ ...currentFile, name: value })}
        />
      </ModalBody>
      <ModalFooter>
        <Button className="font-normal" variant="text" onPress={handleClose}>
          Close
        </Button>
        <Button
          type="submit"
          form="create-folder-form"
          className="font-normal"
          variant="filledTonal"
          isDisabled={createFolder.isPending || !currentFile.name}
          isLoading={createFolder.isPending}
        >
          {createFolder.isPending ? "Creating" : "Create"}
        </Button>
      </ModalFooter>
    </>
  );
});

interface DeleteDialogProps {
  queryKey: any;
  handleClose: () => void;
}

const DeleteDialog = memo(({ handleClose, queryKey }: DeleteDialogProps) => {
  const queryClient = useQueryClient();

  const deleteFiles = $api.useMutation("post", "/files/delete", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const selectedFiles = useModalStore((state) => state.selectedFiles) as string[];

  const onDelete = useCallback(() => {
    deleteFiles.mutateAsync({ body: { ids: selectedFiles } });
    handleClose();
  }, [selectedFiles]);

  return (
    <>
      <ModalHeader className="flex flex-col gap-1">Delete Files</ModalHeader>
      <ModalBody>
        <h1 className="text-large font-medium mt-2">
          {`Are you sure to delete ${selectedFiles.length} file${
            selectedFiles.length > 1 ? "s" : ""
          } ?`}
        </h1>
      </ModalBody>
      <ModalFooter>
        <Button className="font-normal" variant="text" onPress={handleClose}>
          No
        </Button>
        <Button
          variant="filledTonal"
          classNames={{
            base: "font-normal",
          }}
          onPress={onDelete}
        >
          Yes
        </Button>
      </ModalFooter>
    </>
  );
});

interface ShareFileDialogProps {
  handleClose: () => void;
}

const defaultShareOptions = {
  expirationDate: "",
  password: "",
};

const ShareFileDialog = memo(({ handleClose }: ShareFileDialogProps) => {
  const file = useModalStore((state) => state.currentFile);

  const queryClient = useQueryClient();

  const { control, handleSubmit } = useForm({
    defaultValues: defaultShareOptions,
  });

  const shareQueryOptions = $api.queryOptions("get", "/files/{id}/share", {
    params: {
      path: {
        id: file.id,
      },
    },
  });

  const { data, isLoading } = useQuery(shareQueryOptions);

  const createShare = $api.useMutation("post", "/files/{id}/share", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shareQueryOptions.queryKey });
      queryClient.invalidateQueries({ queryKey: ["Files_list", "shared"] });
    },
  });

  const deleteShare = $api.useMutation("delete", "/files/{id}/share", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["Files_list", "shared"] });
    },
  });

  const [sharingOn, setSharingOn] = useState(false);

  const [shareLink, setShareLink] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const onShareChange = useCallback(() => {
    setSharingOn((prev) => {
      if (!prev) {
        handleSubmit((data) => {
          const payload = {} as Record<string, string>;
          if (data.expirationDate) {
            payload.expirationDate = `${data.expirationDate}${new Date().toISOString().slice(10)}`;
          }
          if (data.password) {
            payload.password = data.password;
          }
          createShare.mutateAsync({
            params: {
              path: {
                id: file.id,
              },
            },
            body: payload,
          });
        })();
      }
      if (prev) {
        deleteShare.mutateAsync({
          params: {
            path: {
              id: file.id,
            },
          },
        });
        setShareLink("");
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (data) {
      setSharingOn(true);
      setShareLink(`${window.location.origin}/share/${data.id}`);
    }
  }, [data]);

  return (
    <>
      <ModalHeader className="flex items-center justify-between ">
        Share Files
        <Button size="sm" variant="text" isIconOnly onPress={handleClose}>
          <IcRoundClose />
        </Button>
      </ModalHeader>
      <ModalBody>
        <form className="grid grid-cols-6 gap-8 p-2 w-full overflow-y-auto">
          <div className="col-span-6 xs:col-span-3">
            <p className="text-lg font-medium">Set expiration date</p>
            <p className="text-sm font-normal text-on-surface-variant">Link expiration date</p>
          </div>
          <Controller
            name="expirationDate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Input
                size="lg"
                className="col-span-6 xs:col-span-3"
                variant="bordered"
                isInvalid={!!error}
                errorMessage={error?.message}
                type="date"
                min={getNextDate()}
                {...field}
              />
            )}
          />
          <div className="col-span-6 xs:col-span-3">
            <p className="text-lg font-medium">Set link password</p>
            <p className="text-sm font-normal text-on-surface-variant">Public link password</p>
          </div>
          <Controller
            name="password"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Input
                size="lg"
                className="col-span-6 xs:col-span-3"
                variant="bordered"
                autoComplete="off"
                isInvalid={!!error}
                errorMessage={error?.message}
                type={showPassword ? "text" : "password"}
                {...field}
                endContent={
                  <Button
                    isIconOnly
                    className="size-8 min-w-8"
                    variant="text"
                    onPress={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <HidePasswordIcon /> : <ShowPasswordIcon />}
                  </Button>
                }
              />
            )}
          />
        </form>
        <Divider />
        <div className="flex justify-between">
          <h1 className="text-large font-medium mt-2">Sharing {sharingOn ? "On" : "Off"}</h1>
          <div className="flex items-center gap-3">
            {data?.protected && <MdiProtectedOutline className="text-primary" />}

            <Switch size="md" isSelected={sharingOn} onChange={onShareChange} />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Input
          isDisabled={isLoading || !data}
          fullWidth
          variant="bordered"
          readOnly
          value={shareLink}
        />
        <CopyButton value={shareLink} isDisabled={isLoading || !data} />
      </ModalFooter>
    </>
  );
});

interface AssignChannelDialogProps {
  queryKey: any;
  handleClose: () => void;
}

const AssignChannelDialog = memo(({ queryKey, handleClose }: AssignChannelDialogProps) => {
  const queryClient = useQueryClient();
  const { currentFile, actions } = useModalStore(
    useShallow((state) => ({
      currentFile: state.currentFile,
      actions: state.actions,
    })),
  );

  const [localChannelId, setLocalChannelId] = useState((currentFile as any).channelId?.toString() || "");
  const [localTopicId, setLocalTopicId] = useState((currentFile as any).topicId?.toString() || "");

  const { data: channelData, isLoading: channelsLoading } = useQuery($api.queryOptions("get", "/users/channels"));

  const { data: topicData, isLoading: topicsLoading } = useQuery({
    ...$api.queryOptions("get", "/users/channels/{id}/topics", { params: { path: { id: localChannelId } } }),
    enabled: !!localChannelId && !localChannelId.startsWith("-100"), // Only fetch topics if we have a valid channel ID (the API expects the short ID usually)
  });

  const updateFiles = $api.useMutation("patch", "/files/{id}", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const onAssign = useCallback(
    () => {
      let channelId = localChannelId;
      if (channelId.startsWith("-100")) {
        channelId = channelId.slice(4);
      }
      updateFiles
        .mutateAsync({
          params: {
            path: {
              id: currentFile.id,
            },
          },
          body: {
            channelId: channelId ? Number(channelId) : undefined,
            topicId: localTopicId ? Number(localTopicId) : undefined,
          },
        })
        .then(handleClose);
    },
    [currentFile.id, localChannelId, localTopicId, handleClose],
  );

  return (
    <>
      <ModalHeader className="flex flex-col gap-1">Assign Channel & Topic</ModalHeader>
      <ModalBody className="gap-4">
        <Select
          label="Select Channel"
          placeholder="Choose a channel"
          isLoading={channelsLoading}
          selectedKeys={localChannelId ? new Set([localChannelId.toString()]) : new Set()}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0];
            if (selected) {
              setLocalChannelId(selected.toString());
              setLocalTopicId(""); // Reset topic when channel changes
            }
          }}
        >
          {(channelData || []).map((channel) => (
            <SelectItem 
              key={channel.channelId?.toString() || ""} 
              value={channel.channelId?.toString()}
              textValue={`${channel.channelName} (${channel.channelId})`}
            >
              {channel.channelName} ({channel.channelId})
            </SelectItem>
          ))}
        </Select>

        {topicData && topicData.length > 0 && (
          <Select
            label="Select Topic (Optional)"
            placeholder="Choose a topic"
            isLoading={topicsLoading}
            selectedKeys={localTopicId ? new Set([localTopicId.toString()]) : new Set()}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              if (selected) {
                setLocalTopicId(selected.toString());
              }
            }}
          >
            {topicData.map((topic) => (
              <SelectItem 
                key={topic.id?.toString() || ""} 
                value={topic.id?.toString()}
                textValue={topic.name}
              >
                {topic.name}
              </SelectItem>
            ))}
          </Select>
        )}

        <div className="flex flex-col gap-4 p-4 border border-outline-variant/30 rounded-2xl bg-surface-container-low">
          <p className="text-sm font-medium">Manual Override</p>
          <Input
            label="Channel ID"
            variant="bordered"
            placeholder="-100..."
            value={localChannelId}
            onValueChange={setLocalChannelId}
          />
          <Input
            label="Topic ID (Optional)"
            variant="bordered"
            placeholder="e.g. 123"
            value={localTopicId}
            onValueChange={setLocalTopicId}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button className="font-normal" variant="text" onPress={handleClose}>
          Close
        </Button>
        <Button
          className="font-normal"
          variant="filledTonal"
          onPress={onAssign}
          isDisabled={updateFiles.isPending}
          isLoading={updateFiles.isPending}
        >
          Assign
        </Button>
      </ModalFooter>
    </>
  );
});

const ExternalPlayerDialog = memo(({ handleClose }: { handleClose: () => void }) => {
  const { currentFile } = useModalStore(
    useShallow((state) => ({
      currentFile: state.currentFile,
    })),
  );
  const [session] = useSession();
  const search = useSearch({ from: "/_authed/$view", shouldThrow: false }) as any;
  const params = useSearch({ from: "/share/$id", shouldThrow: false }) as any;

  const onOpen = (player: string) => {
    let streamUrl = "";
    if (params?.id) {
      streamUrl = sharedMediaUrl(params.id, currentFile.id, currentFile.name, true);
    } else {
      streamUrl = mediaUrl(currentFile.id, currentFile.name, search?.path || "", session?.hash || "", true);
    }

    let url = "";
    // Mẹo: Encode dấu ":" thành %3a để tránh trình duyệt "normalize" làm mất dấu : trong https://
    const safeStreamUrl = streamUrl.replace("://", "%3a//");

    if (player === "vlc") {
      url = `vlc://${streamUrl}`; // VLC thường xử lý tốt URL thô
    } else if (player === "potplayer") {
      url = `potplayer://${safeStreamUrl}`; 
    } else if (player === "nplayer") {
      url = `nplayer-${streamUrl}`;
    }

    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.click();
    }
    handleClose();
  };

  return (
    <>
      <ModalHeader className="flex flex-col items-center gap-1 pb-0 text-center">
        Phát với
      </ModalHeader>
      <ModalBody className="py-4">
        <div className="flex flex-col gap-2">
          <Button
            size="md"
            variant="filledTonal"
            className="justify-center font-medium"
            onPress={() => onOpen("vlc")}
          >
            VLC Player
          </Button>
          <Button
            size="md"
            variant="filledTonal"
            className="justify-center font-medium"
            onPress={() => onOpen("potplayer")}
          >
            PotPlayer
          </Button>
          <Button
            size="md"
            variant="filledTonal"
            className="justify-center font-medium"
            onPress={() => onOpen("nplayer")}
          >
            nPlayer
          </Button>
        </div>
      </ModalBody>
      <ModalFooter className="justify-center pt-0">
        <Button size="sm" className="font-medium" variant="text" onPress={handleClose}>
          Đóng
        </Button>
      </ModalFooter>
    </>
  );
});

export const FileOperationModal = memo(({ queryKey }: FileModalProps) => {
  const { open, operation, actions } = useModalStore(
    useShallow((state) => ({
      open: state.open,
      operation: state.operation,
      actions: state.actions,
    })),
  );

  const handleClose = useCallback(
    () =>
      actions.set({
        open: false,
      }),
    [],
  );

  const renderOperation = () => {
    switch (operation) {
      case FbActions.RenameFile.id:
        return <RenameDialog queryKey={queryKey} handleClose={handleClose} />;
      case FbActions.CreateFolder.id:
        return <FolderCreateDialog queryKey={queryKey} handleClose={handleClose} />;
      case FbActions.DeleteFiles.id:
        return <DeleteDialog queryKey={queryKey} handleClose={handleClose} />;
      case CustomActions.ShareFiles.id:
        return <ShareFileDialog handleClose={handleClose} />;
      case CustomActions.AssignChannel.id:
        return <AssignChannelDialog queryKey={queryKey} handleClose={handleClose} />;
      case CustomActions.ExternalPlayer.id:
        return <ExternalPlayerDialog handleClose={handleClose} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={open}
      size="xs"
      classNames={{
        wrapper: "overflow-hidden",
        base: "bg-surface w-full shadow-none max-w-[220px]",
      }}
      placement="center"
      onClose={handleClose}
      isDismissable={false}
      hideCloseButton
    >
      <ModalContent>{renderOperation}</ModalContent>
    </Modal>
  );
});
