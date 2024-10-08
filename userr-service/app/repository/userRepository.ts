import { DBClient } from "../utility/databaseClient"
import { UserModel } from "../models/UserModel"
import { DBOperation } from "./dbOperation";
import { ProfileInput } from "../models/dto/AddressInput";
import { AddressModel } from "../models/AdressModel";

export class UserRepository extends DBOperation {
    constructor() {
        super();
    }

    async createAccount({ phone, email, password, salt, user_type} : UserModel ) {
        // DB Operation
        console.log('CreateAccount');
        const client = await DBClient();
        await client.connect();

        const queryString = 
            "INSERT INTO users(phone, email, password, salt, user_type) VALUES($1,$2,$3,$4,$5) RETURNING *";
        const values = [phone, email, password, salt, user_type];
        const result = await this.executeQuery(queryString, values);
        console.log('result')
        if(result.rowCount > 0) {
            return result.rows[0] as UserModel;
        }
    }   

    async findAccount(email: string) {
        const client = await DBClient();
        await client.connect();

        const queryString = 
            "SELECT user_id, email, password, phone, salt, verification_code, expiry, user_type FROM users WHERE email = $1";
        const values = [email];
        const result = await this.executeQuery(queryString, values);
        
        if(result.rowCount < 1) {
            throw new Error("users does not exist with provided email id!");
        }
        return result.rows[0] as UserModel;
    }

    async UpdateVerificationCode( userId: number, code: number, expiry: Date ) {
        // DB Operation
        const client = await DBClient();
        await client.connect();

        const queryString = 
            "UPDATE users SET verification_code=$1, expiry=$2 WHERE user_id=$3 RETURNING *";
        const values = [code, expiry, userId];
        const result = await this.executeQuery(queryString, values);
        
        if(result.rowCount > 0) {
            return result.rows[0] as UserModel;
        }
    }   

    async UpdateVerifyUser( userId: number ) {
        // DB Operation
        const client = await DBClient();
        await client.connect();

        const queryString = 
            "UPDATE users SET verified=TRUE WHERE user_id=$1 AND verified=FALSE RETURNING *";
        const values = [userId];
        const result = await this.executeQuery(queryString, values);
        
        if(result.rowCount > 0) {
            return result.rows[0] as UserModel;
        }
        throw new Error("User Already verified!");
    }

    async UpdateUser(
        userId: number,
        firstName: string,
        lastName: string,
        usertype: string
    ) {
        const client = await DBClient();
        await client.connect();

        const queryString = 
            "UPDATE users SET first_name= $1, last_name=$2, user_type=$3 WHERE user_id=$4 RETURNING *";
        const values = [firstName, lastName, usertype, userId];
        const result = await this.executeQuery(queryString, values);
        
        if(result.rowCount > 0) {
            return result.rows[0] as UserModel;
        }
        throw new Error("error while updating user!");
    }

    async CreateProfile(user_id: number, {
        firstName,
        lastName,
        userType,
        address : {
            addressLine1,
            addressLine2,
            postCode,
            city,
            country
        }
    } : ProfileInput
    ) {
        await this.UpdateUser(
            user_id, 
            firstName, 
            lastName, 
            userType
        );

        const queryString = 
            "INSERT INTO address(user_id, address_line_1, address_line_2, city, country, post_code) VALUES($1,$2,$3,$4,$5,$6) RETURNING *";
        const values = [
            user_id, 
            addressLine1, 
            addressLine2, 
            city, 
            country, 
            postCode
        ];
        const result = await this.executeQuery(queryString, values);

        if(result.rowCount > 0) {
            return result.rows[0] as AddressModel;
        }

        throw new Error("error while creating profile!");
    }

    async getUserProfile(user_id: number) {

        const profileQuery = 
            "SELECT first_name, last_name, email, phone, user_type, verified, stripe_id, payment_id FROM users WHERE user_id=$1"
        const profileValues = [user_id];
        const profileResult = await this.executeQuery(profileQuery, profileValues);

        if(profileResult.rowCount < 1) {
           throw new Error("user profile does not exist");
        }

        const userProfile = profileResult.rows[0] as UserModel;

        const addressQuery = "SELECT address_line_1, address_line_2, city, post_code, country FROM address WHERE user_id=$1"
        const addressValues = [user_id];
        const addressResult = await this.executeQuery(addressQuery, addressValues);

        if(addressResult.rowCount > 0) {
           userProfile.address = addressResult.rows[0] as AddressModel[];
        }

        return userProfile;
    }

    async EditProfile(user_id: number, {
        firstName,
        lastName,
        userType,
        address : {
            addressLine1,
            addressLine2,
            postCode,
            city,
            country,
            id
        }
    } : ProfileInput
    ) {
        const updatedUser= await this.UpdateUser(
            user_id, 
            firstName, 
            lastName, 
            userType
        );

        const addressQuery = "UPDATE address SET address_line_1=$1, address_line_2=$2, city=$3, post_code=$4, country=$5 WHERE id=$6"
        const addressValues = [
            addressLine1,
            addressLine2,
            city,
            postCode,
            country,
            id
        ];
        const addressResult = await this.executeQuery(addressQuery, addressValues);

        if(addressResult.rowCount < 1) {
            throw new Error("error while updating user profile");
        }

        return true;
    }

    async UpdateUserpayment(
        {userId, paymentId, customerId} 
        : {userId: number, paymentId: string, customerId: string}
    ) {
        const client = await DBClient();
        await client.connect();

        const queryString = 
            "UPDATE users SET stripe_id= $1, payment_id=$2 WHERE user_id=$3 RETURNING *";
        const values = [customerId, paymentId, userId];
        const result = await this.executeQuery(queryString, values);   
        if(result.rowCount > 0) {
            return result.rows[0] as UserModel;
        }
        throw new Error("error while updating user payment!");
    }


}