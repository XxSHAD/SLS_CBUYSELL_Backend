import { APIGatewayProxyEventV2 } from "aws-lambda";
import { UserRepository } from "../repository/userRepository";
import { UserService } from "../service/userService";
import middy from "@middy/core";
import bodyParser from "@middy/http-json-body-parser";
import { SellerService } from "../service/sellerService";
import { SellerRepository } from "../repository/sellerRepository";

const service = new SellerService(new SellerRepository());

export const JoinSellerProgram = middy((event: APIGatewayProxyEventV2) => {
  return service.JoinSellerProgram(event);
}).use(bodyParser());

export const GetPaymentMethod = middy((event: APIGatewayProxyEventV2) => {
    return service.GetPaymentMethods(event);
}).use(bodyParser());

  
export const EditPaymentMethod = middy((event: APIGatewayProxyEventV2) => {
    return service.EditPaymentMethod(event);
}).use(bodyParser());