import { forwardRef, useEffect, useRef } from "react";
import Artplayer, { type Option } from "artplayer";
import { useModalStore } from "@/utils/stores";

Artplayer.USE_RAF = true;

interface PlayerProps {
  option: Option & { _currentFile?: any };
  style: React.CSSProperties;
}

export const Player = forwardRef<Artplayer, PlayerProps>(
  ({ option, ...rest }, ref) => {
    const artRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const art = new Artplayer({
        ...option,
        container: artRef.current!,
      });
      const externalSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2z"/></svg>';
      
      art.controls.add({
        name: "external",
        position: "right",
        html: externalSvg,
        tooltip: "Mở bằng trình phát ngoài",
        selector: [
          {
            html: "VLC",
            onClick: function () {
              const streamUrl = art.option.url + (art.option.url.includes("?") ? "&" : "?") + "download=1";
              const url = `vlc://${streamUrl}`;
              const a = document.createElement("a");
              a.href = url;
              a.click();
              art.controls.external.html = externalSvg;
              art.notice.show = "Đang mở VLC...";
              return true;
            },
          },
          {
            html: "PotPlayer",
            onClick: function () {
              const streamUrl = art.option.url + (art.option.url.includes("?") ? "&" : "?") + "download=1";
              const url = `potplayer://?${streamUrl}`;
              const a = document.createElement("a");
              a.href = url;
              a.click();
              art.controls.external.html = externalSvg;
              art.notice.show = "Đang mở PotPlayer...";
              return true;
            },
          },
          {
            html: "nPlayer",
            onClick: function () {
              const streamUrl = art.option.url + (art.option.url.includes("?") ? "&" : "?") + "download=1";
              const url = `nplayer-${streamUrl}`;
              const a = document.createElement("a");
              a.href = url;
              a.click();
              art.controls.external.html = externalSvg;
              art.notice.show = "Đang mở nPlayer...";
              return true;
            },
          },
        ],
      });
      
      if (ref && typeof ref !== "function") ref.current = art;
      else if (ref && typeof ref === "function") ref(art);

      return () => {
        if (art?.destroy) {
          art.video.pause();
          art.video.removeAttribute("src");
          art.video.load();
          art.destroy(false);
        }
      };
    }, [option]);
    return <div ref={artRef} {...rest} />;
  },
);