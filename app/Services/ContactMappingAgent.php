<?php

namespace App\Services;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;

class ContactMappingAgent implements Agent, HasStructuredOutput
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'INSTRUCTIONS'
You are a contact data mapping expert. Given CSV/spreadsheet column headers and sample data rows, you must identify what each column represents in terms of contact information fields.

Map each column to one of these vCard fields:
- full_name: Full name (combined first + last)
- first_name: First/given name
- last_name: Last/family/surname
- middle_name: Middle name
- prefix: Name prefix (Mr., Mrs., Dr.)
- suffix: Name suffix (Jr., Sr., III)
- email: Email address
- email_work: Work email
- email_home: Home/personal email
- phone: Primary phone number
- phone_mobile: Mobile/cell phone
- phone_home: Home phone
- phone_work: Work phone
- phone_fax: Fax number
- company: Company/organization name
- title: Job title/position
- department: Department
- street: Street address
- city: City
- state: State/province/region
- zip: ZIP/postal code
- country: Country
- birthday: Birthday/date of birth
- website: Website URL
- note: Notes/comments
- photo_url: Photo URL
- nickname: Nickname
- skip: Column should be skipped/ignored

Analyze patterns in the data. Return a confidence percentage (0-100) for each mapping. Be smart about column name variations (e.g., "Cell" = phone_mobile, "Org" = company, "DOB" = birthday).
INSTRUCTIONS;
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'mappings' => $schema->array()->items(
                $schema->object([
                    'column_name' => $schema->string()->required(),
                    'field_type' => $schema->string()->required(),
                    'confidence' => $schema->integer()->min(0)->max(100)->required(),
                    'reasoning' => $schema->string()->required(),
                ])
            )->required(),
        ];
    }

    /**
     * @param  array<string>  $headers
     * @param  array<array<string, string>>  $sampleRows
     * @return array{mappings: array<array{column_name: string, field_type: string, confidence: int, reasoning: string}>}
     */
    public function analyze(array $headers, array $sampleRows): array
    {
        $prompt = 'Column headers: '.json_encode($headers)."\n\n";
        $prompt .= 'Sample data (first '.count($sampleRows)." rows):\n";

        foreach ($sampleRows as $index => $row) {
            $prompt .= 'Row '.($index + 1).': '.json_encode($row)."\n";
        }

        $prompt .= "\nMap each column to the most appropriate vCard field type.";

        /** @var \Laravel\Ai\Responses\StructuredAgentResponse $response */
        $response = $this->prompt($prompt);

        return $response->toArray();
    }
}
