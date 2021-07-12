// load required packages
const logger = require("elogger");
const uuid = require("uuid");
const fs = require("fs");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// load article.proto to load the gRPC data contract
const packageDefinition = protoLoader.loadSync("./file_uploader.proto", {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const fileUploaderProto = grpc.loadPackageDefinition(packageDefinition).FileUploaderPackage;

// define file upload method
const uploadFile = (call, callback) => {
    logger.debug(`gRPC ${call.call.handler.path}`);
    
    let name, chunk;
    const tempFilePath = `/tmp/${uuid.v4()}.svg`;
    
    call.on('data', async (payload) => {
        if(payload.data && payload.data=='name' && payload[payload.data]) {
            name = payload[payload.data];
        }
        else if(payload.data && payload.data=='chunk' && payload[payload.data]) {
            chunk = payload[payload.data];
            fs.appendFileSync(tempFilePath, chunk);
            logger.debug(`Writing file chunk: ${tempFilePath}`);
        }
    });

    call.on('end', async () => {
        callback(null, {
            'id': uuid.v4(),
            'name': name
        });
    });
};

// initialize server and register handlers for the respective RPC methods
const server = new grpc.Server();        
server.addService(fileUploaderProto.FileUploaderService.service, {
    uploadFile: uploadFile
});

// bind & start the server process to port: 9090
const bindEndpoint = `0.0.0.0:9090`;
server.bindAsync(bindEndpoint, grpc.ServerCredentials.createInsecure(), (err, response) => {
    if(err) {
        logger.error(err);
    }
    else {
        server.start();
        logger.info(`File uploader gRPC service started on grpc://${bindEndpoint}`);
        
    }
});