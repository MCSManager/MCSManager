import { zip, type AsyncZippable } from "fflate";

export interface ScanItem {
  path: string;
  file?: File;
  isDir: boolean;
}

export async function scanDirectory(entry: FileSystemEntry, path = ""): Promise<ScanItem[]> {
  const items: ScanItem[] = [];

  if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    const currentDirPath = path + entry.name + "/";
    items.push({ path: currentDirPath, isDir: true });

    const dirReader = dirEntry.createReader();

    const readAll = async (): Promise<FileSystemEntry[]> => {
      return new Promise((resolve) => {
        const allResults: FileSystemEntry[] = [];
        const read = () => {
          dirReader.readEntries(
            (results) => {
              if (!results || results.length === 0) {
                resolve(allResults);
              } else {
                allResults.push(...results);
                read();
              }
            },
            (err) => {
              console.error("Directory read error:", err);
              resolve(allResults);
            }
          );
        };
        read();
      });
    };

    const entries = await readAll();
    for (const child of entries) {
      const childItems = await scanDirectory(child, currentDirPath);
      items.push(...childItems);
    }
  } else {
    const file = await new Promise<File | null>((resolve) => {
      (entry as FileSystemFileEntry).file(
        (f) => resolve(f),
        (err) => {
          console.error("File read error:", err);
          resolve(null);
        }
      );
    });
    if (file) {
      items.push({ path: path + entry.name, file, isDir: false });
    }
  }
  return items;
}

export async function compressFolder(items: ScanItem[]): Promise<Uint8Array> {
  const zipData: AsyncZippable = {};

  for (const item of items) {
    if (item.isDir) {
      zipData[item.path] = [new Uint8Array(0), { level: 0 }];
    } else if (item.file) {
      const buffer = await item.file.arrayBuffer();
      zipData[item.path] = [new Uint8Array(buffer), { level: 4 }];
    }
  }

  return new Promise((resolve, reject) => {
    zip(zipData, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
