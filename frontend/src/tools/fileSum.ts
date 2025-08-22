import SparkMD5 from "spark-md5";

export default function fileSum(file: File) {
  const spark = new SparkMD5.ArrayBuffer();
  const fileReader = new FileReader();

  if (file.size === 0) {
    return Promise.reject(new Error("File is empty!"));
  }

  return new Promise<string>((resolve, reject) => {
    fileReader.onload = (e: Event) => {
      try {
        const target = e.target as FileReader;
        if (!target.result) {
          return reject(new Error("FileReader result is null or undefined"));
        }
        const buf = target.result as ArrayBuffer;
        if (!buf || buf.byteLength === 0) {
          return reject(new Error("File is empty or could not be read"));
        }
        const chunkHead = buf.slice(0, 512);
        const chunkTail = buf.slice(-512);
        spark.append(chunkHead);
        spark.append(chunkTail);
        resolve(spark.end());
      } catch (err) {
        return reject(new Error(`FileReader onload error: ${err}`));
      }
    };

    fileReader.onerror = (event: Event) => {
      const target = event.target as FileReader;
      const error = target.error;
      if (error) {
        reject(new Error(`FileReader error: ${error.name} - ${error.message}`));
      } else {
        reject(new Error("FileReader encountered an unknown error"));
      }
    };

    fileReader.onabort = () => {
      reject(new Error("File reading was aborted"));
    };

    fileReader.readAsArrayBuffer(file);
  });
}
