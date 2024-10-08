import { IsNumber, Length } from "class-validator";

export class CartInput {
    @IsNumber()
    qty: number;
    @Length(6, 32)
    productId: string;
}

export class UpdateCartInput {
    @IsNumber()
    qty: number;
}