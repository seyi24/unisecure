export function getGoogleProfileFields(profile: {
  name?: string | null;
  picture?: string | null;
  email_verified?: boolean | null;
}) {
  const name = profile.name?.trim() || null;
  const image = profile.picture?.trim() || null;

  return {
    name,
    image,
    emailVerified: profile.email_verified === true,
  };
}
