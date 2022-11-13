import BasePlugin from '@uppy/core/lib/BasePlugin.js'
import {BlobServiceClient} from "@azure/storage-blob";
import {AbortController} from "@azure/abort-controller";

export default class AzureBlob extends BasePlugin {
    #containerClient;
    #abortControllers;
    #blobHTTPHeaders;
    #blockSize;
    #conditions;
    #concurrency;
    #encryptionScope;
    #maxSingleShotSize;
    #metadata;
    #tags;
    #tier;
    #uploadHandler;

    constructor(uppy, opts) {
        super(uppy, opts);
        this.type = 'uploader';
        this.id = opts.id ?? 'AzureBlob'

        this.#containerClient = new BlobServiceClient(opts.endpoint + opts.sas)
            .getContainerClient(opts.container);
        this.#abortControllers = new Map();

        const defaultOpts = opts.defaultOptions;

        this.#blobHTTPHeaders = defaultOpts?.blobHTTPHeaders;
        this.#blockSize = defaultOpts?.blockSize;
        this.#conditions = defaultOpts?.conditions;
        this.#concurrency = defaultOpts?.concurrency;
        this.#encryptionScope = defaultOpts?.encryptionScope;
        this.#maxSingleShotSize = defaultOpts?.maxSingleShotSize;
        this.#metadata = defaultOpts?.metadata;
        this.#tags = defaultOpts?.tags;
        this.#tier = defaultOpts?.tier;

        this.#uploadHandler = this.uploadFiles.bind(this);
    }

    install() {
        this.uppy.addUploader(this.#uploadHandler);
    }

    uninstall() {
        this.uppy.removeUploader(this.#uploadHandler);
    }

    async uploadFiles(fileIDs) {
        this.uppy.on('file-removed', this.#stopUpload);

        for (const fileID of fileIDs) {
            const file = this.uppy.getFile(fileID);

            try {
                this.uppy.emit('upload-started', file);

                const upload = await this.#startUpload(file, progress => {
                    this.uppy.emit('upload-progress', file, {uploader: this, ...progress});
                });

                this.uppy.emit('upload-success', file, upload);
            } catch (error) {
                this.uppy.emit('upload-error', file, error);
            } finally {
                this.#finishUpload(file);
            }
        }

        this.uppy.off('file-removed', this.#stopUpload);
    }

    async #startUpload(file, onProgress) {
        const abortController = new AbortController();
        this.#abortControllers.set(file.id, abortController);

        const opts = file.options;

        return this.#containerClient
            .getBlockBlobClient(file.name)
            .uploadData(file.data, {
                abortSignal: abortController.signal,
                blobHTTPHeaders: opts?.blobHTTPHeaders ?? this.#blobHTTPHeaders,
                blockSize: opts?.blockSize ?? this.#blockSize,
                concurrency: opts?.concurrency ?? this.#concurrency,
                conditions: opts?.conditions ?? this.#conditions,
                encryptionScope: opts?.encryptionScope ?? this.#encryptionScope,
                maxSingleShotSize: opts?.maxSingleShotSize ?? this.#maxSingleShotSize,
                metadata: opts?.metadata ?? this.#metadata,
                onProgress: progress => onProgress({
                    bytesUploaded: progress.loadedBytes,
                    bytesTotal: file.size
                }),
                tags: opts?.tags ?? this.#tags,
                tier: opts?.tier ?? this.#tier,
            });
    }

    #stopUpload(file) {
        this.#abortControllers.get(file.id)?.abort();
    }

    #finishUpload(file) {
        this.#abortControllers.delete(file.id);
    }
}