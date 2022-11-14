import BasePlugin from "@uppy/core/lib/BasePlugin";
import { BlobServiceClient } from "@azure/storage-blob";
import { AbortController } from "@azure/abort-controller";

export default class AzureBlob extends BasePlugin {
  #abortControllers;
  #containerClient;
  #defaultBlobOptions;
  #uploadHandler;
  #fileRemovedHandler;

  constructor(uppy, opts) {
    super(uppy, opts);
    this.type = "uploader";
    this.id = opts.id ?? "AzureBlob";

    this.#abortControllers = new Map();

    this.#containerClient = new BlobServiceClient(
      opts.endpoint + opts.sas
    ).getContainerClient(opts.container);

    this.#defaultBlobOptions = opts.defaultBlobOptions;

    this.#uploadHandler = this.uploadFiles.bind(this);
    this.#fileRemovedHandler = this.#stopUpload.bind(this);
  }

  install() {
    this.uppy.addUploader(this.#uploadHandler);
  }

  uninstall() {
    this.uppy.removeUploader(this.#uploadHandler);
  }

  async uploadFiles(fileIDs) {
    this.uppy.on("file-removed", this.#fileRemovedHandler);

    for (const fileID of fileIDs) {
      const file = this.uppy.getFile(fileID);

      try {
        this.uppy.emit("upload-started", file);

        const upload = await this.#startUpload(file, (progress) => {
          this.uppy.emit("upload-progress", file, progress);
        });

        this.uppy.emit("upload-success", file, upload);
      } catch (error) {
        this.uppy.emit("upload-error", file, error);
      } finally {
        this.#finishUpload(file);
      }
    }

    this.uppy.off("file-removed", this.#fileRemovedHandler);
  }

  async #startUpload(file, onProgress) {
    const abortController = new AbortController();
    this.#abortControllers.set(file.id, abortController);

    return this.#containerClient
      .getBlockBlobClient(file.name)
      .uploadData(file.data, {
        ...this.#defaultBlobOptions,
        ...file.blobOptions,
        abortSignal: abortController.signal,
        onProgress: (progress) =>
          onProgress(this.#azureProgressToUppyProgress(progress, file)),
      });
  }

  #azureProgressToUppyProgress(azureProgress, file) {
    return {
      uploader: this,
      bytesUploaded: azureProgress.loadedBytes,
      bytesTotal: file.size,
    };
  }

  #stopUpload(file) {
    this.#abortControllers.get(file.id)?.abort();
  }

  #finishUpload(file) {
    this.#abortControllers.delete(file.id);
  }
}
