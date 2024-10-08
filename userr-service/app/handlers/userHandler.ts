import { APIGatewayProxyEventV2 } from "aws-lambda";
import { UserRepository } from "../repository/userRepository";
import { UserService } from "../service/userService";
import middy from "@middy/core";
import bodyParser from "@middy/http-json-body-parser";

const service = new UserService(new UserRepository());

export const SignUp = middy((event: APIGatewayProxyEventV2) => {
  return service.CreateUser(event);
}).use(bodyParser());

export const Login = middy((event: APIGatewayProxyEventV2) => {
  console.log(event);
  return service.UserLogin(event);
}).use(bodyParser());

export const GetVerificationCode = middy((event: APIGatewayProxyEventV2) => {
  return service.GetVerificationToken(event);
}).use(bodyParser());

export const Verify = middy((event: APIGatewayProxyEventV2) => {
  return service.VerifyUser(event);
}).use(bodyParser());

export const CreateProfile = middy((event: APIGatewayProxyEventV2) => {
  return service.CreateProfile(event);
}).use(bodyParser());

export const EditProfile = middy((event: APIGatewayProxyEventV2) => {
  return service.EditProfile(event);
}).use(bodyParser());

export const GetProfile = middy((event: APIGatewayProxyEventV2) => {
  return service.GetProfile(event);
}).use(bodyParser());













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