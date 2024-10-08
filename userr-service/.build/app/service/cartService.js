"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const response_1 = require("../utility/response");
const userRepository_1 = require("../repository/userRepository");
const tsyringe_1 = require("tsyringe");
const class_transformer_1 = require("class-transformer");
const errors_1 = require("../utility/errors");
const password_1 = require("../utility/password");
const cartRepository_1 = require("../repository/cartRepository");
const CartInput_1 = require("../models/dto/CartInput");
const message_queue_1 = require("../message-queue");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const payment_1 = require("../utility/payment");
let CartService = class CartService {
    constructor(repository) {
        this.repository = repository;
    }
    ResponseWithError(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, response_1.ErrorResponse)(404, "requested method is not supported");
        });
    }
    // Cart Section
    CreateCart(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = event.headers.authorization;
                const payload = yield (0, password_1.VerifyToken)(token);
                if (!payload)
                    return (0, response_1.ErrorResponse)(403, "authorization falied");
                const input = (0, class_transformer_1.plainToClass)(CartInput_1.CartInput, event.body);
                const error = yield (0, errors_1.AppValidationError)(input);
                if (error)
                    return (0, response_1.ErrorResponse)(404, error);
                // DB Operation
                let currentCart = yield this.repository.findShoppingCart(payload.user_id);
                console.log(currentCart);
                if (!currentCart)
                    currentCart = yield this.repository.createShoppingCart(payload.user_id);
                if (!currentCart) {
                    return (0, response_1.ErrorResponse)(500, "create cart failed!");
                }
                // find the item if exist
                let currentProduct = yield this.repository.findCartItemByProductId(input.productId, currentCart.cart_id);
                console.log('currentProduct', currentProduct);
                if (currentProduct) {
                    // if exists then update the qty
                    yield this.repository.updateCartItemByProductId(input.productId, currentProduct.item_qty += input.qty);
                }
                else {
                    console.log('productId', input.productId);
                    const { data, status } = yield (0, message_queue_1.PullData)({
                        action: "PULL_PRODUCT_DATA",
                        productId: input.productId
                    });
                    console.log("Getting Product", data);
                    if (status != 200) {
                        return (0, response_1.ErrorResponse)(500, "failed to get product data!");
                    }
                    let cartItem = data.data;
                    cartItem.item_qty = input.qty;
                    cartItem.cart_id = currentCart.cart_id;
                    yield this.repository.createCartItem(cartItem);
                    // return ErrorResponse(500, "failed to add to cart!")
                }
                const cartItems = yield this.repository.findCartItemsByCartId(currentCart.cart_id);
                return (0, response_1.SuccessResponse)(cartItems);
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
    GetCart(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = event.headers.authorization;
                const payload = yield (0, password_1.VerifyToken)(token);
                if (!payload)
                    return (0, response_1.ErrorResponse)(403, "authorization falied");
                // const result = await this.repository.findCartItems(payload.user_id);
                const cartItems = yield this.repository.findCartItems(payload.user_id);
                const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.item_qty, 0);
                const appFee = (0, payment_1.APPLICATION_FEE)(totalAmount) + (0, payment_1.STRIPE_FEE)(totalAmount);
                return (0, response_1.SuccessResponse)({ cartItems, totalAmount, appFee });
            }
            catch (err) {
                return (0, response_1.ErrorResponse)(500, err);
            }
        });
    }
    Updatecart(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = event.headers.authorization;
                const payload = yield (0, password_1.VerifyToken)(token);
                const cartItemId = Number(event.pathParameters.id);
                if (!payload)
                    return (0, response_1.ErrorResponse)(403, "authorization falied");
                const input = (0, class_transformer_1.plainToClass)(CartInput_1.UpdateCartInput, event.body);
                const error = yield (0, errors_1.AppValidationError)(input);
                if (error)
                    return (0, response_1.ErrorResponse)(404, error);
                // DB Operation
                const cartItem = yield this.repository.updateCartItemById(cartItemId, input.qty);
                if (cartItem) {
                    return (0, response_1.SuccessResponse)(cartItem);
                }
                return (0, response_1.ErrorResponse)(500, error);
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
    DeleteCart(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = event.headers.authorization;
                const payload = yield (0, password_1.VerifyToken)(token);
                const cartItemId = Number(event.pathParameters.id);
                if (!payload)
                    return (0, response_1.ErrorResponse)(403, "authorization falied");
                // DB Operation
                const deletedItem = yield this.repository.deleteCartItem(cartItemId);
                return (0, response_1.SuccessResponse)(deletedItem);
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
    CollectPayment(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = event.headers.authorization;
                const payload = yield (0, password_1.VerifyToken)(token);
                if (!payload)
                    return (0, response_1.ErrorResponse)(403, "authorization failed!");
                const { stripe_id, email, phone } = yield new userRepository_1.UserRepository().getUserProfile(payload.user_id);
                const cartItems = yield this.repository.findCartItems(payload.user_id);
                const total = cartItems.reduce((sum, item) => sum + item.price * item.item_qty, 0);
                const appFee = (0, payment_1.APPLICATION_FEE)(total);
                const stripeFee = (0, payment_1.STRIPE_FEE)(total);
                const amount = total + appFee + stripeFee;
                // initilize Payment gateway
                const { secret, publishableKey, customerId, paymentId } = yield (0, payment_1.CreatePaymentSession)({
                    amount,
                    email,
                    phone,
                    customerId: stripe_id,
                });
                yield new userRepository_1.UserRepository().UpdateUserpayment({
                    userId: payload.user_id,
                    customerId,
                    paymentId
                });
                return (0, response_1.SuccessResponse)({ secret, publishableKey });
            }
            catch (error) {
                console.log(error);
                return (0, response_1.ErrorResponse)(500, error);
            }
        });
    }
    PlaceOrder(event) {
        return __awaiter(this, void 0, void 0, function* () {
            // get cart items
            const token = event.headers.authorization;
            const payload = yield (0, password_1.VerifyToken)(token);
            if (!payload)
                return (0, response_1.ErrorResponse)(403, "authorization failed!");
            const { payment_id } = yield new userRepository_1.UserRepository().getUserProfile(payload.user_id);
            const paymentInfo = yield (0, payment_1.RetrivePayment)(payment_id);
            if (paymentInfo.status === "succeeded") {
                const cartItems = yield this.repository.findCartItems(payload.user_id);
                // Send SNS topic to create Order [Transaction MS] => email to user
                const params = {
                    Message: JSON.stringify(cartItems),
                    TopicArn: process.env.SNS_TOPIC,
                    MessageAttributes: {
                        actionType: {
                            DataType: "String",
                            StringValue: "place_order",
                        },
                    },
                };
                const sns = new aws_sdk_1.default.SNS();
                const response = yield sns.publish(params).promise();
                console.log(response);
                // update  payment_id = ""
                //delete all cart items
                return (0, response_1.SuccessResponse)({ msg: "success", params });
            }
            return (0, response_1.ErrorResponse)(503, new Error('payment failed'));
        });
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, tsyringe_1.autoInjectable)(),
    __metadata("design:paramtypes", [cartRepository_1.CartRepository])
], CartService);
//# sourceMappingURL=cartService.js.map