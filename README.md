# Uppy Azure Blob

<a href="https://www.npmjs.com/package/uppy-azure-blob"><img src="https://img.shields.io/npm/v/uppy-azure-blob.svg?style=flat-square"></a>

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

The AzureBlob plugin can be used to upload files directly to an Azure Blob Container.

This is an unofficial Uppy plugin.

## Example

```js
import Uppy from '@uppy/core';
import AzureBlob from 'uppy-azure-blob';

const uppy = new Uppy();

uppy.use(AzureBlob, {
    endpoint: 'myaccount.blob.core.windows.net',
    container: 'uppy',
    sas: '?sv=2021-08-06&ss=...',
    defaultOptions: {
        // @see https://learn.microsoft.com/en-us/javascript/api/@azure/storage-blob/blockblobparalleluploadoptions
        // blobHTTPHeaders: ...,
        // blockSize: ...,
        // conditions: ...,
        // concurrency: ...,
        // encryptionScope: ...,
        // maxSingleShotSize: ...,
        metadata: {
            uploader: 'Foo'
        },
        // tags: ...,
        // tier: ...,
    }
});
```

```js
new Uppy({
    onBeforeFileAdded: (currentFile) => {
        // You can overwrite the default options
        currentFile.options = {
            metadata: {
                uploader: 'Bar'
            }
        };
        return currentFile;
    }
});
```

## Installation

```bash
$ npm install uppy-azure-blob
```

## Azure Blob configuration

### CORS

Azure Blob Containers do not allow public uploads for security reasons. To allow Uppy and the browser to upload directly to a container, its CORS permissions need to be configured.

For example, you can create following CORS settings for debugging. But please customize the settings carefully according to your requirements in production environment.

* Allowed origins: *
* Allowed verbs: PUT
* Allowed headers: *
* Exposed headers: *
* Maximum age (seconds): 86400

### Shared Access Signatures (SAS)

To upload a file in chunks, the sas token needs the **write** permission.

## License

[The MIT License](./LICENSE).
