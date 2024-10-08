"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetProfile = exports.EditProfile = exports.CreateProfile = exports.Verify = exports.GetVerificationCode = exports.Login = exports.SignUp = void 0;
const userRepository_1 = require("../repository/userRepository");
const userService_1 = require("../service/userService");
const core_1 = __importDefault(require("@middy/core"));
const http_json_body_parser_1 = __importDefault(require("@middy/http-json-body-parser"));
const service = new userService_1.UserService(new userRepository_1.UserRepository());
exports.SignUp = (0, core_1.default)((event) => {
    return service.CreateUser(event);
}).use((0, http_json_body_parser_1.default)());
exports.Login = (0, core_1.default)((event) => {
    console.log(event);
    return service.UserLogin(event);
}).use((0, http_json_body_parser_1.default)());
exports.GetVerificationCode = (0, core_1.default)((event) => {
    return service.GetVerificationToken(event);
}).use((0, http_json_body_parser_1.default)());
exports.Verify = (0, core_1.default)((event) => {
    return service.VerifyUser(event);
}).use((0, http_json_body_parser_1.default)());
exports.CreateProfile = (0, core_1.default)((event) => {
    return service.CreateProfile(event);
}).use((0, http_json_body_parser_1.default)());
exports.EditProfile = (0, core_1.default)((event) => {
    return service.EditProfile(event);
}).use((0, http_json_body_parser_1.default)());
exports.GetProfile = (0, core_1.default)((event) => {
    return service.GetProfile(event);
}).use((0, http_json_body_parser_1.default)());
// import { container } from "tsyringe";
// import { APIGatewayProxyEventV2 } from "aws-lambda";
// import { UserService } from '../service/userService';
// import { ErrorResponse } from "../utility/response";
// import middy from "@middy/core";
// import bodyParser from "@middy/http-json-body-parser"
// import { CartService } from "../service/cartService";
// const service = container.resolve(UserService)
// const cartService = container.resolve(CartService)
// export const Signup = middy((event: APIGatewayProxyEventV2) => {
//     console.log(event)    
//     //application business logic
//     return service.CreateUser(event);   
//     console.log('Signup')
// }).use(bodyParser());
// export const Login = middy((event: APIGatewayProxyEventV2) => {
//     return service.UserLogin(event);  
// }).use(bodyParser());
// export const Verify = middy((event: APIGatewayProxyEventV2) => {
//     const httpMethod = event.requestContext.http.method.toLowerCase();
//     if(httpMethod == 'post') {
//         return service.VerifyUser(event);  
//     } else if(httpMethod == 'get') {
//         return service.GetVerificationToken(event);
//     } else {
//         return service.ResponseWithError(event);
//     }
// }).use(bodyParser());
// export const Profile = middy((event: APIGatewayProxyEventV2) => {
//     const httpMethod = event.requestContext.http.method.toLowerCase();
//     if(httpMethod == 'post') {
//         return service.CreateProfile(event);
//     } else if(httpMethod == 'put') {
//         return service.EditProfile(event)
//     } else if(httpMethod == 'get') {
//         return service.GetProfile(event)
//     } else {
//         return ErrorResponse(404, "request method is not supported")
//     }
// }).use(bodyParser());
// export const Cart = middy((event: APIGatewayProxyEventV2) => {
//     const httpMethod = event.requestContext.http.method.toLowerCase();
//     if(httpMethod == 'post') {
//         return cartService.CreateCart(event);
//     } else if(httpMethod == 'put') {
//         return cartService.Updatecart(event)
//     } else if(httpMethod == 'get') {
//         return cartService.GetCart(event)
//     } else if(httpMethod == 'delete') {
//         return cartService.DeleteCart(event)
//     }  else {
//         return ErrorResponse(404, "request method is not supported")
//     }
// }).use(bodyParser());
// export const CollectPayment = middy((event: APIGatewayProxyEventV2) => {
//     return cartService.CollectPayment(event)
// }).use(
//     bodyParser()
// );
// export const Payment = middy((event: APIGatewayProxyEventV2) => {
//     const httpMethod = event.requestContext.http.method.toLowerCase();
//     if(httpMethod == 'post') {
//         return service.CreatePaymentMethod(event);
//     } else if(httpMethod == 'put') {
//         return service.UpdatePaymentMethod(event)
//     } else if(httpMethod == 'get') {
//         return service.GetPaymentMethod(event)
//     } else {
//         return ErrorResponse(404, "request method is not supported")
//     }
// }).use(bodyParser());
//# sourceMappingURL=userHandler.js.map