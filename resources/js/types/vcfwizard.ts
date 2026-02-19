export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ImportRecord = {
    id: string;
    user_id: string | null;
    original_filename: string;
    file_type: string;
    file_size: number;
    row_count: number;
    column_headers: string[] | null;
    mapped_fields: Record<string, string> | null;
    ai_suggestions: AiSuggestion[] | null;
    status: ImportStatus;
    duplicates_found: number;
    duplicate_details: number[][] | null;
    error_message: string | null;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
    export?: ExportRecord;
};

export type ExportRecord = {
    id: string;
    user_id: string | null;
    import_id: string | null;
    filename: string;
    file_path: string;
    format: string;
    contact_count: number;
    download_count: number;
    expires_at: string | null;
    public_token: string | null;
    is_public: boolean;
    created_at: string;
};

export type MappingTemplateRecord = {
    id: string;
    user_id: string;
    name: string;
    mapping: Record<string, string>;
    is_public: boolean;
    usage_count: number;
    created_at: string;
};

export type AiSuggestion = {
    column_name: string;
    field_type: string;
    confidence: number;
    reasoning: string;
};

export type WizardStep =
    | 'upload'
    | 'mapping'
    | 'preview'
    | 'generate'
    | 'download';

export type UploadResponse = {
    import_ulid: string;
    headers: string[];
    preview_rows: Record<string, string>[];
    total_rows: number;
};

export type AiMappingResponse = {
    suggestions: AiSuggestion[];
};

export type ApplyMappingResponse = {
    duplicates_found: number;
    duplicate_groups: number[][];
    total_rows: number;
};

export type GenerateResponse = {
    status: 'completed' | 'queued';
    export_ulid?: string;
    filename?: string;
    contact_count?: number;
    message?: string;
    import_ulid?: string;
};

export type StatusResponse = {
    status: ImportStatus;
    row_count: number;
    export_ulid?: string;
    filename?: string;
    contact_count?: number;
    error?: string;
};

export type VcardFieldType =
    | 'full_name'
    | 'first_name'
    | 'last_name'
    | 'middle_name'
    | 'prefix'
    | 'suffix'
    | 'email'
    | 'email_work'
    | 'email_home'
    | 'phone'
    | 'phone_mobile'
    | 'phone_home'
    | 'phone_work'
    | 'phone_fax'
    | 'company'
    | 'title'
    | 'department'
    | 'street'
    | 'city'
    | 'state'
    | 'zip'
    | 'country'
    | 'birthday'
    | 'website'
    | 'note'
    | 'photo_url'
    | 'nickname'
    | 'skip';

export const VCARD_FIELD_OPTIONS: {
    value: VcardFieldType;
    label: string;
    icon: string;
}[] = [
    { value: 'full_name', label: 'Full Name', icon: 'User' },
    { value: 'first_name', label: 'First Name', icon: 'User' },
    { value: 'last_name', label: 'Last Name', icon: 'User' },
    { value: 'middle_name', label: 'Middle Name', icon: 'User' },
    { value: 'prefix', label: 'Prefix', icon: 'Crown' },
    { value: 'suffix', label: 'Suffix', icon: 'Crown' },
    { value: 'email', label: 'Email', icon: 'Mail' },
    { value: 'email_work', label: 'Work Email', icon: 'Mail' },
    { value: 'email_home', label: 'Home Email', icon: 'Mail' },
    { value: 'phone', label: 'Phone', icon: 'Phone' },
    { value: 'phone_mobile', label: 'Mobile', icon: 'Smartphone' },
    { value: 'phone_home', label: 'Home Phone', icon: 'Phone' },
    { value: 'phone_work', label: 'Work Phone', icon: 'Phone' },
    { value: 'phone_fax', label: 'Fax', icon: 'Printer' },
    { value: 'company', label: 'Company', icon: 'Building2' },
    { value: 'title', label: 'Job Title', icon: 'Briefcase' },
    { value: 'department', label: 'Department', icon: 'Building2' },
    { value: 'street', label: 'Street', icon: 'MapPin' },
    { value: 'city', label: 'City', icon: 'MapPin' },
    { value: 'state', label: 'State', icon: 'MapPin' },
    { value: 'zip', label: 'ZIP Code', icon: 'MapPin' },
    { value: 'country', label: 'Country', icon: 'Globe' },
    { value: 'birthday', label: 'Birthday', icon: 'Cake' },
    { value: 'website', label: 'Website', icon: 'Globe' },
    { value: 'note', label: 'Notes', icon: 'FileText' },
    { value: 'photo_url', label: 'Photo URL', icon: 'Image' },
    { value: 'nickname', label: 'Nickname', icon: 'AtSign' },
    { value: 'skip', label: 'Skip', icon: 'X' },
];

export type DashboardStats = {
    total_imports: number;
    total_contacts: number;
    total_exports: number;
    ai_rows_used: number;
    ai_rows_limit: number;
};

export type IntegrationRecord = {
    id: string;
    type: string;
    name: string;
    is_active: boolean;
    token_expired: boolean;
    metadata: Record<string, unknown> | null;
    created_at: string;
};

export type WebhookRecord = {
    id: string;
    name: string;
    url: string;
    events: string[];
    is_active: boolean;
    failure_count: number;
    last_triggered_at: string | null;
    deliveries_count?: number;
    created_at: string;
};

export type WebhookDeliveryRecord = {
    id: string;
    event: string;
    payload: Record<string, unknown>;
    response_code: number | null;
    response_body: string | null;
    attempt: number;
    status: string;
    delivered_at: string | null;
    created_at: string;
};

export type ApiKeyRecord = {
    id: string;
    name: string;
    key_prefix: string;
    usage_count: number;
    last_used_at: string | null;
    expires_at: string | null;
    created_at: string;
};

export type SubscriptionInfo = {
    stripe_status: string;
    ends_at: string | null;
    trial_ends_at: string | null;
} | null;

export type AiUsage = {
    used: number;
    limit: number;
    resetsAt: string | null;
};
