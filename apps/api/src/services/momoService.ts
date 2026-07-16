import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
const API_USER = process.env.MTN_MOMO_API_USER || '';
const API_KEY = process.env.MTN_MOMO_API_KEY || '';
const SUBSCRIPTION_KEY = process.env.MTN_MOMO_SUBSCRIPTION_KEY || '';
const ENVIRONMENT = process.env.MTN_MOMO_ENVIRONMENT || 'sandbox';

// Get API token
const getAccessToken = async (): Promise<string> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/collection/token/`,
      {},
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${API_USER}:${API_KEY}`).toString('base64')}`,
          'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
        },
      }
    );
    return response.data.access_token;
  } catch (error: any) {
    console.error('MTN MoMo Token Error:', error.response?.data || error.message);
    throw new Error('Failed to get MTN MoMo access token');
  }
};

// Request payment (Customer pays business)
export const requestPayment = async (
  phoneNumber: string,
  amount: number,
  currency: string = 'UGX',
  externalId: string,
  payerMessage: string = 'Gas Mobil Payment',
  payeeNote: string = 'Gas cylinder delivery'
): Promise<{ referenceId: string; status: string }> => {
  try {
    const accessToken = await getAccessToken();
    const referenceId = uuidv4();

    // Format phone number (remove + if present)
    const formattedPhone = phoneNumber.replace(/^\+/, '');

    const response = await axios.post(
      `${BASE_URL}/collection/v1_0/requesttopay`,
      {
        amount: amount.toString(),
        currency,
        externalId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: formattedPhone,
        },
        payerMessage,
        payeeNote,
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': ENVIRONMENT,
          'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      referenceId,
      status: response.status === 202 ? 'pending' : 'failed',
    };
  } catch (error: any) {
    console.error('MTN MoMo Payment Request Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Payment request failed');
  }
};

// Check payment status
export const getPaymentStatus = async (referenceId: string): Promise<any> => {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.get(
      `${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Target-Environment': ENVIRONMENT,
          'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('MTN MoMo Status Error:', error.response?.data || error.message);
    throw new Error('Failed to get payment status');
  }
};

// Transfer to business account (Disbursement)
export const transferToBusiness = async (
  phoneNumber: string,
  amount: number,
  currency: string = 'UGX',
  externalId: string,
  payeeNote: string = 'Driver payout'
): Promise<{ referenceId: string }> => {
  try {
    const disbursementToken = await getDisbursementToken();
    const referenceId = uuidv4();

    const formattedPhone = phoneNumber.replace(/^\+/, '');

    await axios.post(
      `${BASE_URL}/disbursement/v1_0/transfer`,
      {
        amount: amount.toString(),
        currency,
        externalId,
        payee: {
          partyIdType: 'MSISDN',
          partyId: formattedPhone,
        },
        payeeNote,
        payerMessage: 'Gas Mobil Transfer',
      },
      {
        headers: {
          'Authorization': `Bearer ${disbursementToken}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': ENVIRONMENT,
          'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_DISBURSEMENT_SUBSCRIPTION_KEY || SUBSCRIPTION_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return { referenceId };
  } catch (error: any) {
    console.error('MTN MoMo Transfer Error:', error.response?.data || error.message);
    throw new Error('Transfer failed');
  }
};

// Get disbursement token
const getDisbursementToken = async (): Promise<string> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/disbursement/token/`,
      {},
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.MTN_MOMO_DISBURSEMENT_API_USER || API_USER}:${process.env.MTN_MOMO_DISBURSEMENT_API_KEY || API_KEY}`).toString('base64')}`,
          'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_DISBURSEMENT_SUBSCRIPTION_KEY || SUBSCRIPTION_KEY,
        },
      }
    );
    return response.data.access_token;
  } catch (error: any) {
    throw new Error('Failed to get disbursement token');
  }
};

// Get account balance
export const getAccountBalance = async (): Promise<any> => {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.get(
      `${BASE_URL}/collection/v1_0/account/balance`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Target-Environment': ENVIRONMENT,
          'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('MTN MoMo Balance Error:', error.response?.data || error.message);
    throw new Error('Failed to get account balance');
  }
};