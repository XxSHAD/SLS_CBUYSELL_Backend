"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const databaseClient_1 = require("../utility/databaseClient");
const dbOperation_1 = require("./dbOperation");
class UserRepository extends dbOperation_1.DBOperation {
    constructor() {
        super();
    }
    createAccount(_a) {
        return __awaiter(this, arguments, void 0, function* ({ phone, email, password, salt, user_type }) {
            // DB Operation
            console.log('CreateAccount');
            const client = yield (0, databaseClient_1.DBClient)();
            yield client.connect();
            const queryString = "INSERT INTO users(phone, email, password, salt, user_type) VALUES($1,$2,$3,$4,$5) RETURNING *";
            const values = [phone, email, password, salt, user_type];
            const result = yield this.executeQuery(queryString, values);
            console.log('result');
            if (result.rowCount > 0) {
                return result.rows[0];
            }
        });
    }
    findAccount(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield (0, databaseClient_1.DBClient)();
            yield client.connect();
            const queryString = "SELECT user_id, email, password, phone, salt, verification_code, expiry, user_type FROM users WHERE email = $1";
            const values = [email];
            const result = yield this.executeQuery(queryString, values);
            if (result.rowCount < 1) {
                throw new Error("users does not exist with provided email id!");
            }
            return result.rows[0];
        });
    }
    UpdateVerificationCode(userId, code, expiry) {
        return __awaiter(this, void 0, void 0, function* () {
            // DB Operation
            const client = yield (0, databaseClient_1.DBClient)();
            yield client.connect();
            const queryString = "UPDATE users SET verification_code=$1, expiry=$2 WHERE user_id=$3 RETURNING *";
            const values = [code, expiry, userId];
            const result = yield this.executeQuery(queryString, values);
            if (result.rowCount > 0) {
                return result.rows[0];
            }
        });
    }
    UpdateVerifyUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // DB Operation
            const client = yield (0, databaseClient_1.DBClient)();
            yield client.connect();
            const queryString = "UPDATE users SET verified=TRUE WHERE user_id=$1 AND verified=FALSE RETURNING *";
            const values = [userId];
            const result = yield this.executeQuery(queryString, values);
            if (result.rowCount > 0) {
                return result.rows[0];
            }
            throw new Error("User Already verified!");
        });
    }
    UpdateUser(userId, firstName, lastName, usertype) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield (0, databaseClient_1.DBClient)();
            yield client.connect();
            const queryString = "UPDATE users SET first_name= $1, last_name=$2, user_type=$3 WHERE user_id=$4 RETURNING *";
            const values = [firstName, lastName, usertype, userId];
            const result = yield this.executeQuery(queryString, values);
            if (result.rowCount > 0) {
                return result.rows[0];
            }
            throw new Error("error while updating user!");
        });
    }
    CreateProfile(user_id_1, _a) {
        return __awaiter(this, arguments, void 0, function* (user_id, { firstName, lastName, userType, address: { addressLine1, addressLine2, postCode, city, country } }) {
            yield this.UpdateUser(user_id, firstName, lastName, userType);
            const queryString = "INSERT INTO address(user_id, address_line_1, address_line_2, city, country, post_code) VALUES($1,$2,$3,$4,$5,$6) RETURNING *";
            const values = [
                user_id,
                addressLine1,
                addressLine2,
                city,
                country,
                postCode
            ];
            const result = yield this.executeQuery(queryString, values);
            if (result.rowCount > 0) {
                return result.rows[0];
            }
            throw new Error("error while creating profile!");
        });
    }
    getUserProfile(user_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const profileQuery = "SELECT first_name, last_name, email, phone, user_type, verified, stripe_id, payment_id FROM users WHERE user_id=$1";
            const profileValues = [user_id];
            const profileResult = yield this.executeQuery(profileQuery, profileValues);
            if (profileResult.rowCount < 1) {
                throw new Error("user profile does not exist");
            }
            const userProfile = profileResult.rows[0];
            const addressQuery = "SELECT address_line_1, address_line_2, city, post_code, country FROM address WHERE user_id=$1";
            const addressValues = [user_id];
            const addressResult = yield this.executeQuery(addressQuery, addressValues);
            if (addressResult.rowCount > 0) {
                userProfile.address = addressResult.rows[0];
            }
            return userProfile;
        });
    }
    EditProfile(user_id_1, _a) {
        return __awaiter(this, arguments, void 0, function* (user_id, { firstName, lastName, userType, address: { addressLine1, addressLine2, postCode, city, country, id } }) {
            const updatedUser = yield this.UpdateUser(user_id, firstName, lastName, userType);
            const addressQuery = "UPDATE address SET address_line_1=$1, address_line_2=$2, city=$3, post_code=$4, country=$5 WHERE id=$6";
            const addressValues = [
                addressLine1,
                addressLine2,
                city,
                postCode,
                country,
                id
            ];
            const addressResult = yield this.executeQuery(addressQuery, addressValues);
            if (addressResult.rowCount < 1) {
                throw new Error("error while updating user profile");
            }
            return true;
        });
    }
    UpdateUserpayment(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, paymentId, customerId }) {
            const client = yield (0, databaseClient_1.DBClient)();
            yield client.connect();
            const queryString = "UPDATE users SET stripe_id= $1, payment_id=$2 WHERE user_id=$3 RETURNING *";
            const values = [customerId, paymentId, userId];
            const result = yield this.executeQuery(queryString, values);
            if (result.rowCount > 0) {
                return result.rows[0];
            }
            throw new Error("error while updating user payment!");
        });
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=userRepository.js.map