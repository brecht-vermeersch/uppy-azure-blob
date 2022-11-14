import BasePlugin from '@uppy/core/lib/BasePlugin.js'
import {BlobServiceClient} from "@azure/storage-blob";
import {AbortController} from "@azure/abort-controller";

export default class AzureBlob extends BasePlugin {
    #containerClient;
    #abortControllers;

    #defaultBlobHTTPHeaders;
    #defaultBlockSize;
    #defaultConditions;
    #defaultConcurrency;
    #defaultEncryptionScope;
    #defaultMaxSingleShotSize;
    #defaultMetadata;
    #defaultTags;
    #defaultTier;

    #uploadHandler;
    #fileRemovedHandler;

    constructor(uppy, opts) {
        super(uppy, opts);
        this.type = 'uploader';
        this.id = opts.id ?? 'AzureBlob'

        this.#containerClient = new BlobServiceClient(opts.endpoint + opts.sas)
            .getContainerClient(opts.container);
        this.#abortControllers = new Map();

        this.#defaultBlobHTTPHeaders = opts.defaultBlobOptions?.blobHTTPHeaders;
        this.#defaultBlockSize = opts.defaultBlobOptions?.blockSize;
        this.#defaultConditions = opts.defaultBlobOptions?.conditions;
        this.#defaultConcurrency = opts.defaultBlobOptions?.concurrency;
        this.#defaultEncryptionScope = opts.defaultBlobOptions?.encryptionScope;
        this.#defaultMaxSingleShotSize = opts.defaultBlobOptions?.maxSingleShotSize;
        this.#defaultMetadata = opts.defaultBlobOptions?.metadata;
        this.#defaultTags = opts.defaultBlobOptions?.tags;
        this.#defaultTier = opts.defaultBlobOptions?.tier;

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
        this.uppy.on('file-removed', this.#fileRemovedHandler);

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

        this.uppy.off('file-removed', this.#fileRemovedHandler);
    }

    async #startUpload(file, onProgress) {
        const abortController = new AbortController();
        this.#abortControllers.set(file.id, abortController);

        return this.#containerClient
            .getBlockBlobClient(file.name)
            .uploadData(file.data, {
                abortSignal: abortController.signal,
                blobHTTPHeaders: file.blobOptions?.blobHTTPHeaders ?? this.#defaultBlobHTTPHeaders,
                blockSize: file.blobOptions?.blockSize ?? this.#defaultBlockSize,
                concurrency: file.blobOptions?.concurrency ?? this.#defaultConcurrency,
                conditions: file.blobOptions?.conditions ?? this.#defaultConditions,
                encryptionScope: file.blobOptions?.encryptionScope ?? this.#defaultEncryptionScope,
                maxSingleShotSize: file.blobOptions?.maxSingleShotSize ?? this.#defaultMaxSingleShotSize,
                metadata: file.blobOptions?.metadata ?? this.#defaultMetadata,
                onProgress: progress => onProgress({
                    bytesUploaded: progress.loadedBytes,
                    bytesTotal: file.size
                }),
                tags: file.blobOptions?.tags ?? this.#defaultTags,
                tier: file.blobOptions?.tier ?? this.#defaultTier,
            });
    }

    #stopUpload(file) {
        this.#abortControllers.get(file.id)?.abort();
    }

    #finishUpload(file) {
        this.#abortControllers.delete(file.id);
    }
}