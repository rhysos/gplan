/**
 * Checks if required environment variables are set
 * @returns Object with status of required environment variables
 */
export function checkRequiredEnvVars() {
  const requiredVars = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  }

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  return {
    allSet: missingVars.length === 0,
    missingVars,
    envVars: Object.keys(requiredVars).reduce(
      (acc, key) => {
        acc[key] = !!requiredVars[key as keyof typeof requiredVars]
        return acc
      },
      {} as Record<string, boolean>,
    ),
  }
}

/**
 * Logs environment variable status to console
 */
export function logEnvVarStatus() {
  const { allSet, missingVars, envVars } = checkRequiredEnvVars()

  console.log("Environment Variables Status:")
  console.table(envVars)

  if (!allSet) {
    console.warn(`Missing environment variables: ${missingVars.join(", ")}`)
  } else {
    console.log("All required environment variables are set")
  }
}
