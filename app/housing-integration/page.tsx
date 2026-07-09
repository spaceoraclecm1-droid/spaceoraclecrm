import HousingIntegrationClient from './HousingIntegrationClient';

async function getHousingConfig() {
  return {
    profileConfigured: !!(process.env.HOUSING_PROFILE_ID && process.env.HOUSING_ENCRYPTION_KEY),
    profileId: process.env.HOUSING_PROFILE_ID ? `${process.env.HOUSING_PROFILE_ID.substring(0, 4)}...` : null
  };
}

export default async function HousingIntegration() {
  const config = await getHousingConfig();

  return <HousingIntegrationClient profileConfigured={config.profileConfigured} />;
}