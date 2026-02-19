<?php

namespace App\DTOs;

readonly class ContactMappingData
{
    /**
     * @param  array<string, string>  $mapping
     * @param  array<array{column_name: string, field_type: string, confidence: int, reasoning: string}>  $suggestions
     */
    public function __construct(
        public array $mapping,
        public array $suggestions = [],
    ) {}

    /**
     * @param  array<array{column_name: string, field_type: string, confidence: int, reasoning: string}>  $aiSuggestions
     * @return array<string, string>
     */
    public static function suggestionsToMapping(array $aiSuggestions): array
    {
        $mapping = [];

        foreach ($aiSuggestions as $suggestion) {
            $mapping[$suggestion['column_name']] = $suggestion['field_type'];
        }

        return $mapping;
    }
}
