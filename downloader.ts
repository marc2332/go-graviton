import {
  DownloaderHelper,
  Stats,
  DownloaderError,
} from "node-downloader-helper";
import path from "path";
import os from "os";
import fs from "fs";

type Platform = "win" | "linux" | "darwin";

const Platforms = {
  darwin: "macOS",
  linux: "Linux",
  win: "windows",
};

function download(platform: Platform, { StatusBarItem, Notification }: any) {
  const dl = new DownloaderHelper(
    `https://github.com/buttercubz/go-graviton/raw/master/bin/go-langserver_${
      Platforms[platform]
    }${platform === "win" ? ".exe" : ""}`,
    path.join(__dirname, "bin"),
    {
      fileName: `go-langserver_${Platforms[platform]}${
        platform === "win" ? ".exe" : ""
      }`,
    }
  );

  const barItem = new StatusBarItem({
    label: "Downloading",
    hint: "Downloading the binaries",
    important: true,
  });

  dl.start();

  // * when download is ending
  dl.on("end", () => {
    barItem.setLabel("Download Completed");
    new Notification({
      title: "Go",
      content: "Download Completed, please restart graviton",
      lifeTime: 9000,
    });
    setTimeout(() => {
      barItem.hide();
    }, 3000);
  });

  // * show progress download
  dl.on("progress", (ld: Stats) => {
    barItem.setLabel(`Downloading ${Math.round(ld.progress)} %`);
  });

  // * show a any error
  dl.on("error", (err: DownloaderError) => {
    barItem.setLabel("download error");

    setTimeout(() => {
      barItem.hide();
    }, 1000);

    const notify = new Notification({
      title: "Go (download error)",
      content: err.message,
      lifeTime: Infinity,
      buttons: [
        {
          label: "try again",
          action() {
            // * delete old bin folder
            fs.rmdirSync(path.join(__dirname, "bin"));
            fs.mkdirSync(path.join(__dirname, "bin"));

            // * try to download again
            download(platform, { StatusBarItem, Notification });
          },
        },
        {
          label: "Later",
          action() {
            notify.remove();
            barItem.hide();
          },
        },
      ],
    });
  });
}

function getOS(): { platform: Platform; path: string } {
  switch (os.platform()) {
    case "win32":
      return {
        platform: "win",
        path: path.join(__dirname, "bin", "go-langserver_windows.exe"),
      };

    case "linux":
      return {
        platform: "linux",
        path: path.join(__dirname, "bin", "go-langserver_Linux"),
      };

    case "darwin":
      return {
        platform: "darwin",
        path: path.join(__dirname, "bin", "go-langserver_macOS"),
      };

    default:
      throw new Error("Platform not supported.");
  }
}

export { download, getOS };
