<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMappingTemplateRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'mapping' => ['required', 'array'],
            'mapping.*' => ['required', 'string'],
            'is_public' => ['sometimes', 'boolean'],
        ];
    }
}
