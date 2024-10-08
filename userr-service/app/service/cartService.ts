import { ErrorResponse, SuccessResponse } from "../utility/response"
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { UserRepository } from "../repository/userRepository"
import { autoInjectable } from "tsyringe";
import { plainToClass } from "class-transformer";
import { AppValidationError } from "../utility/errors";
import { VerifyToken } from "../utility/password";
import { CartRepository } from "../repository/cartRepository";
import { CartInput, UpdateCartInput } from "../models/dto/CartInput";
import { CartItemModel } from "../models/CartItemsModel";
import { PullData } from "../message-queue";
import aws from 'aws-sdk';
import { APPLICATION_FEE, CreatePaymentSession, RetrivePayment, STRIPE_FEE } from "../utility/payment";

@autoInjectable()
export class CartService {
    repository: CartRepository;
    constructor(repository: CartRepository) {
        this.repository = repository;
    }

    async ResponseWithError(event: APIGatewayProxyEventV2) {
        return ErrorResponse(404, "requested method is not supported")
    }

    // Cart Section
    async CreateCart(event: APIGatewayProxyEventV2) {
        try {
            const token = event.headers.authorization;
            const payload = await VerifyToken(token);
            if (!payload) return ErrorResponse(403, "authorization falied");

            const input = plainToClass(CartInput, event.body);
            const error = await AppValidationError(input);
            if (error) return ErrorResponse(404, error);
            // DB Operation
            let currentCart = await this.repository.findShoppingCart(payload.user_id);
            console.log(currentCart);
            if (!currentCart)
                currentCart = await this.repository.createShoppingCart(payload.user_id);
            if (!currentCart) {
                return ErrorResponse(500, "create cart failed!")
            }


            // find the item if exist
            let currentProduct = await this.repository.findCartItemByProductId(input.productId, currentCart.cart_id);
            console.log('currentProduct', currentProduct)
            if (currentProduct) {
                // if exists then update the qty
                await this.repository.updateCartItemByProductId(
                    input.productId,
                    currentProduct.item_qty += input.qty
                );
            } else {
                console.log('productId', input.productId);
                const { data, status } = await PullData({
                    action: "PULL_PRODUCT_DATA",
                    productId: input.productId
                })
                console.log("Getting Product", data)
                if (status != 200) {
                    return ErrorResponse(500, "failed to get product data!")
                }

                let cartItem = data.data as CartItemModel;
                cartItem.item_qty = input.qty;
                cartItem.cart_id = currentCart.cart_id;
                await this.repository.createCartItem(cartItem);
                // return ErrorResponse(500, "failed to add to cart!")
            }
            const cartItems = await this.repository.findCartItemsByCartId(currentCart.cart_id);
            return SuccessResponse(cartItems)
        } catch (error) {
            console.log(error);
            return ErrorResponse(500, error)
        }
    }

    async GetCart(event: APIGatewayProxyEventV2) {
        try {
            const token = event.headers.authorization;
            const payload = await VerifyToken(token);
            if (!payload) return ErrorResponse(403, "authorization falied");
            // const result = await this.repository.findCartItems(payload.user_id);
            const cartItems = await this.repository.findCartItems(payload.user_id);

            const totalAmount = cartItems.reduce(
                (sum, item) => sum + item.price * item.item_qty,
                0
            );
             
            const appFee = APPLICATION_FEE(totalAmount) + STRIPE_FEE(totalAmount);
            
            
            return SuccessResponse({ cartItems, totalAmount, appFee })
        } catch (err) {
            return ErrorResponse(500, err)
        }
    }

    async Updatecart(event: APIGatewayProxyEventV2) {
        try {
            const token = event.headers.authorization;
            const payload = await VerifyToken(token);
            const cartItemId = Number(event.pathParameters.id);
            if (!payload) return ErrorResponse(403, "authorization falied");

            const input = plainToClass(UpdateCartInput, event.body);
            const error = await AppValidationError(input);
            if (error) return ErrorResponse(404, error);
            // DB Operation
            const cartItem = await this.repository.updateCartItemById(
                cartItemId,
                input.qty
            )
            if (cartItem) {
                return SuccessResponse(cartItem)
            }
            return ErrorResponse(500, error)
        } catch (error) {
            console.log(error);
            return ErrorResponse(500, error)
        }
    }

    async DeleteCart(event: APIGatewayProxyEventV2) {
        try {
            const token = event.headers.authorization;
            const payload = await VerifyToken(token);
            const cartItemId = Number(event.pathParameters.id);
            if (!payload) return ErrorResponse(403, "authorization falied");

            // DB Operation
            const deletedItem = await this.repository.deleteCartItem(
                cartItemId
            )
            return SuccessResponse(deletedItem)
        } catch (error) {
            console.log(error);
            return ErrorResponse(500, error)
        }
    }

    async CollectPayment(event: APIGatewayProxyEventV2) {
        try {
            const token = event.headers.authorization;
            const payload = await VerifyToken(token);
            if (!payload) return ErrorResponse(403, "authorization failed!");

            const { stripe_id, email, phone } = 
                await new UserRepository().getUserProfile(payload.user_id);
            const cartItems = await this.repository.findCartItems(payload.user_id);

            const total = cartItems.reduce(
                (sum, item) => sum + item.price * item.item_qty,
                0
            );
             
            const appFee = APPLICATION_FEE(total);
            const stripeFee = STRIPE_FEE(total);
            const amount = total + appFee + stripeFee;
            
            // initilize Payment gateway
            const { secret, publishableKey, customerId, paymentId } = 
                await CreatePaymentSession({
                amount,
                email,
                phone,
                customerId: stripe_id,
            })
    
            await new UserRepository().UpdateUserpayment({
                userId: payload.user_id,
                customerId,
                paymentId
            }); 

            return SuccessResponse({ secret, publishableKey});
        } catch (error) {
            console.log(error);
            return ErrorResponse(500, error);
        }
    }

    async PlaceOrder(event: APIGatewayProxyEventV2) {
        // get cart items
        const token = event.headers.authorization;
        const payload = await VerifyToken(token);
        if (!payload) return ErrorResponse(403, "authorization failed!");
        
        
        const { payment_id } = await new UserRepository().getUserProfile(payload.user_id);
        const paymentInfo = await RetrivePayment(payment_id);
        if (paymentInfo.status === "succeeded") {
            const cartItems = await this.repository.findCartItems(payload.user_id);
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
            const sns = new aws.SNS();
            const response = await sns.publish(params).promise();
            console.log(response)
            // update  payment_id = ""
            //delete all cart items
            return SuccessResponse({ msg: "success", params})
        }

        return ErrorResponse(503, new Error('payment failed'));
    }

}