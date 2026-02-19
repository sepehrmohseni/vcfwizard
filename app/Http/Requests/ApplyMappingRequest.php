<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApplyMappingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<string>>
     */
    public function rules(): array
    {
        return [
            'import_ulid' => ['required', 'string', 'exists:imports,id'],
            'mapping' => ['required', 'array'],
            'mapping.*' => ['required', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'import_ulid.required' => 'Import identifier is required.',
            'import_ulid.exists' => 'Import not found.',
            'mapping.required' => 'Field mapping is required.',
        ];
    }
}
