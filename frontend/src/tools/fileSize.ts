export const convertFileSize = (e: string) =>
  `${(parseFloat(e) / Math.pow(1024, Math.floor(Math.log(parseFloat(e)) / Math.log(1024)))).toFixed(
    2
  )} ${
    ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][
      Math.floor(Math.log(parseFloat(e)) / Math.log(1024))
    ]
  }`;
