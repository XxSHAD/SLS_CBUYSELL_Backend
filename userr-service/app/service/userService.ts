import { ErrorResponse, SuccessResponse } from "../utility/response"
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { UserRepository } from "../repository/userRepository"
import { autoInjectable } from "tsyringe";
import { plainToClass } from "class-transformer";
import { SignupInput } from "../models/dto/SignupInput";
import { AppValidationError } from "../utility/errors";
import { GetHashedPassword, GetSalt, GetToken, ValidatePassword, VerifyToken } from "../utility/password";
import { LoginInput } from "../models/dto/LoginInput";
import { GenerateAccessCode, SendVerificationCode } from "../utility/notification";
import { VerificationInput } from "../models/dto/UpdateInput";
import { TimeDifference } from "../utility/dateHelper";
import { ProfileInput } from "../models/dto/AddressInput";

@autoInjectable()
export class UserService {
    repository: UserRepository;
    constructor(repository: UserRepository) {
        this.repository = repository;
    }
 
    async ResponseWithError(event: APIGatewayProxyEventV2) {
        return ErrorResponse(404, "requested method is not supported")
    }

    async CreateUser(event: APIGatewayProxyEventV2) {
        try {
            console.log('CreateUser')
            const input = plainToClass(SignupInput, event.body);
            const error = await AppValidationError(input);
            if (error) return ErrorResponse(404, error);
            console.log(input)
            const salt = await GetSalt();
            const hashedPassword = await GetHashedPassword(input.password, salt);
            const data = await this.repository.createAccount({
                email: input.email,
                password: hashedPassword,
                phone: input.phone,
                user_type: "BUYER",
                salt: salt,
            })
            console.log('data', data)

            const token = GetToken(data);

            return SuccessResponse({
                token,
                email: data.email,
                firstName: data.first_name,
                lastName: data.last_name,
                phone: data.phone,
                userType: data.user_type,
                _id: data.user_id
            }); 
        } catch (error) {
            return ErrorResponse(500, error);
        }
    }

    async UserLogin(event: APIGatewayProxyEventV2) {
        try {
            const input = plainToClass(LoginInput, event.body);
            const error = await AppValidationError(input);
            if (error) return ErrorResponse(404, error);

            const data = await this.repository.findAccount(input.email);

            console.log(input.password, data.password, data.salt)
            // check or validate the password
            const verified = await ValidatePassword(input.password, data.password, data.salt);
            if (!verified) {
                throw new Error("password does not match")
            }
            const token = GetToken(data);

            return SuccessResponse({
                token,
                email: data.email,
                firstName: data.first_name,
                lastName: data.last_name,
                phone: data.phone,
                userType: data.user_type,
                _id: data.user_id
            }); 
        } catch (error) {
            return ErrorResponse(500, error);
        }
    }


    //Verify User
    async GetVerificationToken(event: APIGatewayProxyEventV2) {
        const token = event.headers.authorization;
        const payload = await VerifyToken(token);
        if (!payload) return ErrorResponse(403, "authorization falied")
            
        const { code, expiry } = GenerateAccessCode();
        // save on DB to confirm verification
        await this.repository.UpdateVerificationCode(
            payload.user_id, 
            code, 
            expiry
        );
        const response = await SendVerificationCode(code, payload.phone);
        return SuccessResponse({
            message: "verification code is sent to your registered mobile number!",
        });
    }

    async VerifyUser(event: APIGatewayProxyEventV2) {
        const token = event.headers.authorization;
        const payload = await VerifyToken(token);
        if (!payload) return ErrorResponse(403, "authorization falied");

        const input = plainToClass(VerificationInput, event.body);
        const error = await AppValidationError(input);
        if (error) return ErrorResponse(404, error);

        const { verification_code, expiry } = await this.repository.findAccount(
            payload.email
        );
        console.log(verification_code, input.code)
        if(verification_code === parseInt(input.code)) {
            // check expiry
            const currentTime = new Date();
            const diff = TimeDifference(expiry, currentTime.toISOString(), "m")
            if(diff > 0) {
                await this.repository.UpdateVerifyUser(payload.user_id);
            } else {
                return ErrorResponse(403, "verification code is expired");
            }
        } else {
            return ErrorResponse(403, "entered verification code is wrong");
        }

        return SuccessResponse({
            message: "user verified!",
        });
    }


    // Profile Section
    async CreateProfile(event: APIGatewayProxyEventV2) {
        try {
            const token = event.headers.authorization;
            const payload = await VerifyToken(token);
            if (!payload) return ErrorResponse(403, "authorization falied");
    
            const input = plainToClass(ProfileInput, event.body);
            const error = await AppValidationError(input);
            if (error) return ErrorResponse(404, error);
            // DB Operation
            const result = await this.repository.CreateProfile(payload.user_id, input);
            console.log(result)
            return SuccessResponse({ message: "Profile Created!", result })   
        } catch (error) {
            console.log(error);
            return ErrorResponse(500, error)
        }
    }

    async GetProfile(event: APIGatewayProxyEventV2) {
        try {
            const token = event.headers.authorization;
            const payload = await VerifyToken(token);
            if (!payload) return ErrorResponse(403, "authorization falied");
            const result = await this.repository.getUserProfile(payload.user_id);
            console.log(payload)
            return SuccessResponse(result);
        } catch (error) {
            console.log(error);
            return ErrorResponse(500, error)
        }
    }

    async EditProfile(event: APIGatewayProxyEventV2) {
        try {
            const token = event.headers.authorization;
            const payload = await VerifyToken(token);
            if (!payload) return ErrorResponse(403, "authorization falied");
    
            const input = plainToClass(ProfileInput, event.body);
            const error = await AppValidationError(input);
            if (error) return ErrorResponse(404, error);
            // DB Operation
            await this.repository.EditProfile(payload.user_id, input);
            return SuccessResponse({ message: "Profile Updated!" })
        } catch (error) {
            console.log(error);
            return ErrorResponse(500, error)
        }
    }

    // Payment Section
    async CreatePaymentMethod(event: APIGatewayProxyEventV2) {
        return SuccessResponse({ message: "response from CreatePaymentMethod" })
    }

    async GetPaymentMethod(event: APIGatewayProxyEventV2) {
        return SuccessResponse({ message: "response from GetPaymentMethod" })
    }

    async UpdatePaymentMethod(event: APIGatewayProxyEventV2) {
        return SuccessResponse({ message: "response from UpdatePaymentMethod" })
    }

}