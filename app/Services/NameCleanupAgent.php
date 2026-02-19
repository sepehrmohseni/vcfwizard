<?php

namespace App\Services;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\UseCheapestModel;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;

#[UseCheapestModel]
class NameCleanupAgent implements Agent, HasStructuredOutput
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'INSTRUCTIONS'
You are a name formatting expert. Given a list of contact names, clean them up to proper formatting:
- Capitalize properly (Title Case for western names)
- Fix obvious typos in common names
- Separate first/last names correctly
- Handle prefixes (Mr., Mrs., Dr.) and suffixes (Jr., Sr., III)
- Preserve cultural name formats (East Asian, Arabic, etc.)
- Remove extra spaces, fix encoding issues
INSTRUCTIONS;
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'names' => $schema->array()->items(
                $schema->object([
                    'original' => $schema->string()->required(),
                    'prefix' => $schema->string(),
                    'first_name' => $schema->string()->required(),
                    'middle_name' => $schema->string(),
                    'last_name' => $schema->string()->required(),
                    'suffix' => $schema->string(),
                    'display_name' => $schema->string()->required(),
                ])
            )->required(),
        ];
    }

    /**
     * @param  array<string>  $names
     * @return array{names: array<array{original: string, prefix: string, first_name: string, middle_name: string, last_name: string, suffix: string, display_name: string}>}
     */
    public function cleanup(array $names): array
    {
        $prompt = "Clean up these contact names:\n";
        foreach ($names as $name) {
            $prompt .= "- {$name}\n";
        }

        /** @var \Laravel\Ai\Responses\StructuredAgentResponse $response */
        $response = $this->prompt($prompt);

        return $response->toArray();
    }
}
