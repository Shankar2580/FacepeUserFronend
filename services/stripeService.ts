import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { STRIPE_CONFIG, STRIPE_ENDPOINTS } from '../constants/Stripe';
import { Alert } from 'react-native';

export interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SetupIntentResponse {
  client_secret: string;
  setup_intent_id: string;
}

class StripeService {
  private apiBaseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.apiBaseUrl = STRIPE_CONFIG.API_BASE_URL;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async makeApiCall(endpoint: string, options: RequestInit = {}) {
    if (!this.authToken) {
      throw new Error('No auth token provided');
    }

    const url = `${this.apiBaseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async createSetupIntent(): Promise<SetupIntentResponse> {
    return this.makeApiCall(STRIPE_ENDPOINTS.CREATE_SETUP_INTENT, {
      method: 'POST',
    });
  }

  async confirmSetupIntent(setupIntentId: string): Promise<any> {
    return this.makeApiCall(`${STRIPE_ENDPOINTS.CONFIRM_SETUP_INTENT}/${setupIntentId}`, {
      method: 'POST',
    });
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return this.makeApiCall(STRIPE_ENDPOINTS.GET_PAYMENT_METHODS);
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    return this.makeApiCall(`${STRIPE_ENDPOINTS.DELETE_PAYMENT_METHOD}/${paymentMethodId}`, {
      method: 'DELETE',
    });
  }
}

export const stripeService = new StripeService();

// Hook for using Stripe functionality
export const useStripePayments = () => {
  const { confirmSetupIntent } = useStripe();

  const addPaymentMethod = async (authToken: string) => {
    try {
      // Set auth token
      stripeService.setAuthToken(authToken);

      // Create Setup Intent
      const setupIntentResponse = await stripeService.createSetupIntent();

      // Confirm Setup Intent with Stripe
      const { setupIntent } = await confirmSetupIntent(
        setupIntentResponse.client_secret,
        {
          paymentMethodType: 'Card',
        }
      );

      if (setupIntent?.status === 'Succeeded') {
        // Confirm on backend and save payment method
        const result = await stripeService.confirmSetupIntent(setupIntentResponse.setup_intent_id);
        
        if (result.success) {
          Alert.alert('Success', 'Payment method added successfully!');
          return result.payment_method;
        } else {
          throw new Error('Failed to save payment method');
        }
      } else {
        throw new Error('Setup Intent confirmation failed');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add payment method');
      throw error;
    }
  };

  const getPaymentMethods = async (authToken: string): Promise<PaymentMethod[]> => {
    try {
      stripeService.setAuthToken(authToken);
      return await stripeService.getPaymentMethods();
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      Alert.alert('Error', 'Failed to fetch payment methods');
      throw error;
    }
  };

  const removePaymentMethod = async (paymentMethodId: string, authToken: string) => {
    try {
      stripeService.setAuthToken(authToken);
      await stripeService.deletePaymentMethod(paymentMethodId);
      Alert.alert('Success', 'Payment method removed successfully!');
    } catch (error) {
      console.error('Error removing payment method:', error);
      Alert.alert('Error', 'Failed to remove payment method');
      throw error;
    }
  };

  return {
    addPaymentMethod,
    getPaymentMethods,
    removePaymentMethod,
  };
}; 