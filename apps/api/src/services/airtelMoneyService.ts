import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = process.env.AIRTEL_MONEY_BASE_URL || 'https://openapiuat.airtel.africa';
const CLIENT_ID = process.env.AIRTEL_MONEY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.AIRTEL_MONEY_CLIENT_SECRET || '';

// Get access token
const getAccessToken = async (): Promise<string> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/auth/oauth2/token`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error: any) {
    console.error('Airtel Money Token Error:', error.response?.data || error.message);
    throw new Error('Failed to get Airtel Money token');
  }
};

// Request payment
export const requestPayment = async (
  phoneNumber: string,
  amount: number,
  currency: string = 'UGX',
  reference: string,
  transactionId: string = uuidv4()
): Promise<{ transactionId: string; status: string }> => {
  try {
    const accessToken = await getAccessToken();

    const formattedPhone = phoneNumber.replace(/^\+/, '');

    const response = await axios.post(
      `${BASE_URL}/merchant/v1/payments/`,
      {
        reference,
        subscriber: {
          country: 'UG',
          currency,
          msisdn: formattedPhone,
        },
        transaction: {
          amount,
          country: 'UG',
          currency,
          id: transactionId,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Country': 'UG',
          'X-Currency': currency,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      transactionId,
      status: response.data.status?.success === true ? 'pending' : 'failed',
    };
  } catch (error: any) {
    console.error('Airtel Money Payment Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || 'Payment request failed');
  }
};

// Check transaction status
export const getTransactionStatus = async (transactionId: string): Promise<any> => {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.get(
      `${BASE_URL}/standard/v1/payments/${transactionId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Country': 'UG',
          'X-Currency': 'UGX',
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Airtel Money Status Error:', error.response?.data || error.message);
    throw new Error('Failed to get transaction status');
  }
};

// Refund transaction
export const refundTransaction = async (
  transactionId: string,
  amount: number
): Promise<any> => {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.post(
      `${BASE_URL}/standard/v1/payments/refund`,
      {
        transaction: {
          airtel_money_id: transactionId,
          amount,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Country': 'UG',
          'X-Currency': 'UGX',
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Airtel Money Refund Error:', error.response?.data || error.message);
    throw new Error('Refund failed');
  }
};