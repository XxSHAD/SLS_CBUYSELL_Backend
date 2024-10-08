"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBClient = void 0;
const pg_1 = require("pg");
const DBClient = () => {
    return new pg_1.Client({
        host: "user-service.cvkssq6qaa8u.us-east-1.rds.amazonaws.com",
        user: "user_service",
        database: "user_service",
        password: "Bilalcr7",
        port: 5432,
    });
};
exports.DBClient = DBClient;
// export const DBClient = () => {
//     return new Client({
//         host: "user-service.cvkssq6qaa8u.us-east-1.rds.amazonaws.com",
//         user: "user_service",
//         database: "user_service",
//         password: "Bilalcr7",
//         port: 5432,
//     })
// }
// - serverless-plugin-typescript
// export const DBClient = () => {
//     return new Client({
//         host: "ec2-3-65-204-75.eu-central-1.compute.amazonaws.com",
//         user: "user_service",
//         database: "user_service",
//         password: "user_service#1234",
//         port: 5432,
//     })
// }
//# sourceMappingURL=databaseClient.js.map