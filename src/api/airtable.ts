import axios from 'axios';

// Configuration
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || '';
const AIRTABLE_BASE_URL = 'https://api.airtable.com/v0';

// Table names
export const TABLES = {
  VESSELS: 'VESSELS',
  CERTIFICATES: 'CERTIFICATES',
  CREW: 'CREW',
  PORT_CALLS: 'PORT_CALLS',
  FORMS_RECEIVED: 'FORMS_RECEIVED',
  FORMS_COMPLETED: 'FORMS_COMPLETED',
  ALERTS: 'ALERTS',
  SPARES: 'SPARES',
  SUPPLIERS: 'SUPPLIERS',
  PROCUREMENT: 'PROCUREMENT',
};

// Create Airtable client
const client = axios.create({
  baseURL: `${AIRTABLE_BASE_URL}/${AIRTABLE_BASE_ID}`,
  headers: {
    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch all records from a table
 */
export async function fetchFromAirtable(tableName: string, filterByFormula?: string) {
  try {
    const config: any = {
      params: {
        pageSize: 100,
      },
    };

    if (filterByFormula) {
      config.params.filterByFormula = filterByFormula;
    }

    const response = await client.get(`/${tableName}`, config);
    return response.data.records;
  } catch (error) {
    console.error(`Failed to fetch from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Fetch single record by ID
 */
export async function fetchRecordFromAirtable(tableName: string, recordId: string) {
  try {
    const response = await client.get(`/${tableName}/${recordId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch record from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Create new record
 */
export async function createRecord(tableName: string, fields: Record<string, any>) {
  try {
    const response = await client.post(`/${tableName}`, {
      records: [
        {
          fields,
        },
      ],
    });
    return response.data.records[0];
  } catch (error) {
    console.error(`Failed to create record in ${tableName}:`, error);
    throw error;
  }
}

/**
 * Update record
 */
export async function updateRecord(tableName: string, recordId: string, fields: Record<string, any>) {
  try {
    const response = await client.patch(`/${tableName}/${recordId}`, {
      fields,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to update record in ${tableName}:`, error);
    throw error;
  }
}

/**
 * Delete record
 */
export async function deleteRecord(tableName: string, recordId: string) {
  try {
    await client.delete(`/${tableName}/${recordId}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete record from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Fetch records with filtering and sorting
 */
export async function fetchRecordsAdvanced(
  tableName: string,
  options?: {
    filterByFormula?: string;
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    fields?: string[];
    pageSize?: number;
  }
) {
  try {
    const params: any = {
      pageSize: options?.pageSize || 100,
    };

    if (options?.filterByFormula) {
      params.filterByFormula = options.filterByFormula;
    }

    if (options?.sort) {
      params.sort = options.sort;
    }

    if (options?.fields) {
      params.fields = options.fields;
    }

    const response = await client.get(`/${tableName}`, { params });
    return response.data.records;
  } catch (error) {
    console.error(`Failed to fetch advanced records from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Batch update records
 */
export async function batchUpdateRecords(
  tableName: string,
  updates: Array<{ id: string; fields: Record<string, any> }>
) {
  try {
    const response = await client.patch(`/${tableName}`, {
      records: updates.map(({ id, fields }) => ({
        id,
        fields,
      })),
    });
    return response.data.records;
  } catch (error) {
    console.error(`Failed to batch update records in ${tableName}:`, error);
    throw error;
  }
}

/**
 * Get vessel by ID
 */
export async function getVesselById(vesselId: string) {
  return fetchRecordFromAirtable(TABLES.VESSELS, vesselId);
}

/**
 * Get all vessels for an owner
 */
export async function getVesselsByOwner(ownerEmail: string) {
  return fetchFromAirtable(
    TABLES.VESSELS,
    `{Owner Email} = "${ownerEmail}"`
  );
}

/**
 * Get forms for a vessel
 */
export async function getFormsByVessel(vesselId: string) {
  return fetchFromAirtable(
    TABLES.FORMS_RECEIVED,
    `{Vessel Name} = "${vesselId}"`
  );
}

/**
 * Get certificates for a vessel
 */
export async function getCertificatesByVessel(vesselId: string) {
  return fetchFromAirtable(
    TABLES.CERTIFICATES,
    `{Vessel Name} = "${vesselId}"`
  );
}

/**
 * Get crew for a vessel
 */
export async function getCrewByVessel(vesselId: string) {
  return fetchFromAirtable(
    TABLES.CREW,
    `{Vessel Name} = "${vesselId}"`
  );
}

/**
 * Get active alerts for a vessel
 */
export async function getActiveAlerts(vesselId?: string) {
  if (vesselId) {
    return fetchFromAirtable(
      TABLES.ALERTS,
      `AND({Status} = "Unread", {Vessel Name} = "${vesselId}")`
    );
  }
  return fetchFromAirtable(
    TABLES.ALERTS,
    `{Status} = "Unread"`
  );
}

/**
 * Create form received record
 */
export async function createFormReceived(formData: {
  formName: string;
  vesselName: string;
  country: string;
  agentName: string;
  agentEmail: string;
}) {
  return createRecord(TABLES.FORMS_RECEIVED, {
    'Form Name': formData.formName,
    'Vessel Name': [formData.vesselName],
    'Country': formData.country,
    'Agent Name': formData.agentName,
    'Agent Email': formData.agentEmail,
    'Received Date': new Date().toISOString().split('T')[0],
    'Processing Status': 'Received',
  });
}

/**
 * Create decision/alert record
 */
export async function createDecisionAlert(alertData: {
  title: string;
  type: 'Certificate Expiry' | 'Form Received' | 'Form Completed' | 'Processing Failed' | 'Crew Document Expiry' | 'Decision Logged';
  vesselId: string;
  message: string;
  priority: 'High' | 'Medium' | 'Low';
}) {
  return createRecord(TABLES.ALERTS, {
    'Alert Title': alertData.title,
    'Alert Type': alertData.type,
    'Vessel Name': [alertData.vesselId],
    'Message': alertData.message,
    'Priority': alertData.priority,
    'Date Created': new Date().toISOString(),
    'Status': 'Unread',
  });
}

export default client;
