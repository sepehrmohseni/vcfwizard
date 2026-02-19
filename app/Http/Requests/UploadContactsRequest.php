<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadContactsRequest extends FormRequest
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
        $allowedMimes = 'csv,xlsx,xls,txt,json';

        return [
            'file' => [
                'required',
                'file',
                'max:10240',
                "mimes:{$allowedMimes}",
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Please select a file to upload.',
            'file.max' => 'File size must not exceed 10MB.',
            'file.mimes' => 'Supported formats: CSV, Excel, TXT, and JSON.',
        ];
    }
}
