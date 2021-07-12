const fs = require('fs');
const logger = require('elogger');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync('./file_uploader.proto', {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const endpoint = 'localhost:9090';
const fileUploaderProto = grpc.loadPackageDefinition(packageDefinition).FileUploaderPackage;
const serviceStub = new fileUploaderProto.FileUploaderService(endpoint, grpc.credentials.createInsecure());

const serviceCall = serviceStub.uploadFile((err, response) => {
    if(err) {
        logger.error(err);
    }
    else {
        console.log(response);
    }
});

serviceCall.write({
    name: 'dots.svg'
});

const readStream = fs.createReadStream('./dots.svg');

readStream.on('data', (chunk) => {
    serviceCall.write({
        chunk: Uint8Array.from(chunk)
    });
});

readStream.on('end', () => {
    serviceCall.end();
});
