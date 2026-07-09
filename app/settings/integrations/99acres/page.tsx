import Integration99AcresClient from './Integration99AcresClient';
import {
  NINETY_NINE_ACRES_CONFIG,
  isAuthConfigured,
} from '@/lib/ninety-nine-acres/config';

export const dynamic = 'force-dynamic';

export default function Page() {
  const config = {
    username: NINETY_NINE_ACRES_CONFIG.USERNAME,
    profileId: NINETY_NINE_ACRES_CONFIG.PROFILE_ID,
    authConfigured: isAuthConfigured(),
    bearerTokenMasked: NINETY_NINE_ACRES_CONFIG.BEARER_TOKEN
      ? `${NINETY_NINE_ACRES_CONFIG.BEARER_TOKEN.slice(0, 12)}…${NINETY_NINE_ACRES_CONFIG.BEARER_TOKEN.slice(-4)}`
      : '',
    webhookPath: NINETY_NINE_ACRES_CONFIG.WEBHOOK_PATH,
  };

  return <Integration99AcresClient config={config} />;
}
