<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateVcfRequest extends FormRequest
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
            'format' => ['sometimes', 'string', 'in:single,zip'],
            'save_template' => ['sometimes', 'boolean'],
            'template_name' => ['required_if:save_template,true', 'nullable', 'string', 'max:255'],
        ];
    }
}
