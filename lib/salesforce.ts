/**
 * Salesforce CRM Integration (Optional)
 *
 * This module provides optional Salesforce integration for enriching
 * call context with CRM data. Enable by setting SF_* environment variables.
 *
 * Required env vars for Salesforce:
 * - SF_CLIENT_ID
 * - SF_USERNAME
 * - SF_LOGIN_URL
 * - SF_PRIVATE_KEY_PEM
 *
 * ## Extending for Other CRMs
 *
 * To add support for a different CRM (HubSpot, Pipedrive, etc.):
 * 1. Create a new file (e.g., `lib/hubspot.ts`) following this pattern
 * 2. Implement `isCrmEnabled()` and `getAccountData()` functions
 * 3. Update `lib/sandbox-context.ts` to call your CRM's getAccountData()
 * 4. Add your CRM's env vars to `lib/config.ts`
 *
 * ## Customizing Salesforce Fields
 *
 * Modify the SOQL query in `getAccountData()` to fetch additional fields
 * from your Salesforce schema.
 */

import { SignJWT, importPKCS8 } from 'jose';
import { config } from './config';

/**
 * Check if Salesforce integration is enabled
 */
export function isSalesforceEnabled(): boolean {
  return config.salesforce.enabled;
}

/**
 * Builds a short-lived JWT assertion and exchanges it for an access token
 */
export async function getSalesforceAccessToken(): Promise<{
  accessToken: string;
  instanceUrl: string;
}> {
  const { clientId, username, loginUrl, privateKeyPem } = config.salesforce;

  if (!clientId || !username || !loginUrl || !privateKeyPem) {
    throw new Error(
      'Salesforce integration not configured. Set SF_CLIENT_ID, SF_USERNAME, SF_LOGIN_URL, and SF_PRIVATE_KEY_PEM.'
    );
  }

  const privateKey = await importPKCS8(privateKeyPem, 'RS256');

  const assertion = await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(clientId)
    .setSubject(username)
    .setAudience(loginUrl)
    .setExpirationTime('3m')
    .sign(privateKey);

  const tokenRes = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Salesforce token error: ${tokenRes.status} ${errText}`);
  }

  const { access_token, instance_url } = await tokenRes.json();
  return {
    accessToken: access_token as string,
    instanceUrl: instance_url as string,
  };
}

/**
 * Query Salesforce using SOQL
 */
export async function querySalesforce<T = Record<string, unknown>>({
  query,
  instanceUrl,
  accessToken,
}: {
  query: string;
  instanceUrl: string;
  accessToken: string;
}): Promise<{ records: T[]; totalSize: number; done: boolean }> {
  const response = await fetch(
    `${instanceUrl}/services/data/v61.0/query?q=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(
      `Salesforce query failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get account data from Salesforce by Account ID
 *
 * Customize the SOQL query below to fetch fields from your CRM schema.
 * The returned data is written to the sandbox as markdown for the AI agent.
 *
 * To add opportunity data, contacts, or other related objects:
 * 1. Add additional queries below
 * 2. Update the return type and returned object
 * 3. Update `formatAccountMarkdown()` in sandbox-context.ts
 */
export async function getAccountData(accountId: string): Promise<{
  accountData: Record<string, unknown> | null;
  opportunityData: Record<string, unknown> | null;
}> {
  if (!isSalesforceEnabled()) {
    return { accountData: null, opportunityData: null };
  }

  try {
    const { accessToken, instanceUrl } = await getSalesforceAccessToken();

    // Query account - customize fields based on your Salesforce (or other CRM)schema
    // Example additions: Description, NumberOfEmployees, AnnualRevenue, Custom_Field__c
    const accountQueryResult = await querySalesforce({
      query: `SELECT Id, Name, Website, Industry, Type FROM Account WHERE Id = '${accountId}'`,
      instanceUrl,
      accessToken,
    });

    const accountData = accountQueryResult.records[0] || null;

    // To add opportunity data, uncomment and customize:
    // const oppQueryResult = await querySalesforce({
    //   query: `SELECT Id, Name, Amount, StageName, CloseDate FROM Opportunity WHERE AccountId = '${accountId}' ORDER BY CloseDate DESC LIMIT 5`,
    //   instanceUrl,
    //   accessToken,
    // });
    // const opportunityData = oppQueryResult.records;

    return { accountData, opportunityData: null };
  } catch (error) {
    console.error('Failed to fetch Salesforce data:', error);
    return { accountData: null, opportunityData: null };
  }
}
