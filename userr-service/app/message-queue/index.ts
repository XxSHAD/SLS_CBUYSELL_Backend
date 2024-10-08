import axios from "axios";

const PRODUCT_SERVICE_URL = " https://2v2ve8np92.execute-api.eu-central-1.amazonaws.com/prod/products-queue"; // it will come from .env

export const PullData = async (requestData: Record<string, unknown>) => {
    return axios.post(PRODUCT_SERVICE_URL, requestData)
}