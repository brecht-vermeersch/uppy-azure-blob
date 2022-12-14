# Uppy Azure Blob

<a href="https://www.npmjs.com/package/uppy-azure-blob"><img src="https://img.shields.io/npm/v/uppy-azure-blob.svg?style=flat-square"></a>

<img src="./logo.svg" width="120" alt="Uppy logo: a superman puppy in a blue suit" align="right">

> **Note** This is a community made Uppy plugin.

The AzureBlob plugin can be used to upload files directly to an Azure Blob Container.

## Example

```js
import Uppy from "@uppy/core";
import AzureBlob from "uppy-azure-blob";

const uppy = new Uppy();

uppy.use(AzureBlob, {
  endpoint: "myaccount.blob.core.windows.net",
  container: "uppy",
  sas: "?sv=2021-08-06&ss=...",
  defaultBlobOptions: {
    // @see https://learn.microsoft.com/en-us/javascript/api/@azure/storage-blob/blockblobparalleluploadoptions
    // blobHTTPHeaders: ...,
    // blockSize: ...,
    // conditions: ...,
    // concurrency: ...,
    // encryptionScope: ...,
    // maxSingleShotSize: ...,
    metadata: {
      uploader: "Foo",
    },
    // tags: ...,
    // tier: ...,
  },
});
```

```js
new Uppy({
  onBeforeFileAdded: (currentFile) => {
    // You can overwrite the default options
    currentFile.blobOptions = {
      metadata: {
        uploader: "Bar",
      },
    };
    return currentFile;
  },
});
```

## Installation

> **Warning** This plugin requires a module bundler such as Vite, Parcel, Webpack, Rollup or others.

```bash
$ npm install uppy-azure-blob
```

## Azure Blob configuration

### CORS

Azure Blob Containers do not allow public uploads for security reasons. To allow Uppy and the browser to upload directly to a container, its CORS permissions need to be configured.

For example, you can create following CORS settings for debugging. But please customize the settings carefully according to your requirements in production environment.

- Allowed origins: \*
- Allowed verbs: PUT
- Allowed headers: \*
- Exposed headers: \*
- Maximum age (seconds): 86400

### Shared Access Signatures (SAS)

To upload a file in chunks, the sas token needs the **write** permission.

## License

[The MIT License](./LICENSE).
