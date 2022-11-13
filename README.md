# @uppy/azure-blob

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

The AzureBlob plugin can be used to upload files directly to an Azure Blob Container.

This is an unofficial uppy plugin. 

## Example

```js
import Uppy from '@uppy/core'
import AzureBlob from '@uppy/azure-blob'

const uppy = new Uppy()
uppy.use(AzureBlob, {
    endpoint: 'myaccount.blob.core.windows.net',
    container: 'uppy',
    sas: '?sv=2021-08-06&ss=...',
    /**
     * Upload options
     * @see https://learn.microsoft.com/en-us/javascript/api/@azure/storage-blob/blockblobparalleluploadoptions?view=azure-node-latest
     */
    blockSize: 10000000, // 10MB
    metadata: {
        uploader: 'uppy'
    }
})
```

## Installation

```bash
$ npm install @uppy/azure-blob
```

## License

[The MIT License](./LICENSE).