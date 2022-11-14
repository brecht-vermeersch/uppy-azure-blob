import type { PluginOptions, BasePlugin } from "@uppy/core";
import type { BlockBlobParallelUploadOptions } from "@azure/storage-blob";

export interface AzureBlobOptions extends PluginOptions {
  endpoint: string;
  container: string;
  sas: string;
  defaultBlobOptions?: BlockBlobParallelUploadOptions;
}

declare class AzureBlob extends BasePlugin<AzureBlobOptions> {}

export default AzureBlob;
