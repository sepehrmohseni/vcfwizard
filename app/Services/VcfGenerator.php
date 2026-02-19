<?php

namespace App\Services;

use JeroenDesloovere\VCard\VCard;

class VcfGenerator
{
    /**
     * @param  array<array<string, mixed>>  $contacts
     * @param  array<string, string>  $mapping
     */
    public function generateSingle(array $contacts, array $mapping): string
    {
        $vcfContent = '';

        foreach ($contacts as $contact) {
            $vcfContent .= $this->buildVcard($contact, $mapping);
        }

        return $vcfContent;
    }

    /**
     * @param  array<array<string, mixed>>  $contacts
     * @param  array<string, string>  $mapping
     * @return array<string, string>
     */
    public function generateIndividual(array $contacts, array $mapping): array
    {
        $files = [];

        foreach ($contacts as $index => $contact) {
            $vcard = $this->buildVcard($contact, $mapping);
            $name = $this->extractName($contact, $mapping);
            $filename = $this->sanitizeFilename($name ?: "contact-{$index}").'.vcf';
            $files[$filename] = $vcard;
        }

        return $files;
    }

    /**
     * @param  array<string, mixed>  $contact
     * @param  array<string, string>  $mapping
     */
    private function buildVcard(array $contact, array $mapping): string
    {
        $vcard = new VCard;
        $mapped = $this->applyMapping($contact, $mapping);

        $lastName = $mapped['last_name'] ?? '';
        $firstName = $mapped['first_name'] ?? '';
        $fullName = $mapped['full_name'] ?? '';

        if (empty($firstName) && empty($lastName) && ! empty($fullName)) {
            $parts = explode(' ', $fullName, 2);
            $firstName = $parts[0] ?? '';
            $lastName = $parts[1] ?? '';
        }

        $vcard->addName(
            $lastName,
            $firstName,
            $mapped['middle_name'] ?? '',
            $mapped['prefix'] ?? '',
            $mapped['suffix'] ?? ''
        );

        if (! empty($mapped['company']) || ! empty($mapped['department'])) {
            $vcard->addCompany($mapped['company'] ?? '', $mapped['department'] ?? '');
        }

        if (! empty($mapped['title'])) {
            $vcard->addJobtitle($mapped['title']);
        }

        $this->addEmails($vcard, $mapped);
        $this->addPhones($vcard, $mapped);
        $this->addAddress($vcard, $mapped);

        if (! empty($mapped['birthday'])) {
            $vcard->addBirthday($mapped['birthday']);
        }

        if (! empty($mapped['website'])) {
            $vcard->addURL($mapped['website']);
        }

        if (! empty($mapped['note'])) {
            $vcard->addNote($mapped['note']);
        }

        $output = $vcard->getOutput();

        if (! empty($mapped['nickname'])) {
            $nickname = str_replace(["\n", "\r", ',', ';'], ' ', $mapped['nickname']);
            $output = str_replace('END:VCARD', "NICKNAME:{$nickname}\r\nEND:VCARD", $output);
        }

        return $output;
    }

    /**
     * @param  array<string, mixed>  $contact
     * @param  array<string, string>  $mapping
     * @return array<string, string>
     */
    private function applyMapping(array $contact, array $mapping): array
    {
        $mapped = [];

        foreach ($mapping as $columnName => $fieldType) {
            if ($fieldType === 'skip' || ! isset($contact[$columnName])) {
                continue;
            }
            $value = trim((string) $contact[$columnName]);
            if ($value !== '') {
                $mapped[$fieldType] = $value;
            }
        }

        return $mapped;
    }

    /**
     * @param  array<string, string>  $mapped
     */
    private function addEmails(VCard $vcard, array $mapped): void
    {
        $emailFields = [
            'email' => 'INTERNET',
            'email_work' => 'INTERNET;WORK',
            'email_home' => 'INTERNET;HOME',
        ];

        foreach ($emailFields as $field => $type) {
            if (! empty($mapped[$field])) {
                $vcard->addEmail($mapped[$field], $type);
            }
        }
    }

    /**
     * @param  array<string, string>  $mapped
     */
    private function addPhones(VCard $vcard, array $mapped): void
    {
        $phoneFields = [
            'phone' => 'PREF',
            'phone_mobile' => 'CELL',
            'phone_home' => 'HOME',
            'phone_work' => 'WORK',
            'phone_fax' => 'FAX',
        ];

        foreach ($phoneFields as $field => $type) {
            if (! empty($mapped[$field])) {
                $normalizer = new PhoneNormalizer;
                $vcard->addPhoneNumber($normalizer->normalize($mapped[$field]), $type);
            }
        }
    }

    /**
     * @param  array<string, string>  $mapped
     */
    private function addAddress(VCard $vcard, array $mapped): void
    {
        $hasAddress = ! empty($mapped['street']) || ! empty($mapped['city'])
            || ! empty($mapped['state']) || ! empty($mapped['zip'])
            || ! empty($mapped['country']);

        if ($hasAddress) {
            $vcard->addAddress(
                '',
                '',
                $mapped['street'] ?? '',
                $mapped['city'] ?? '',
                $mapped['state'] ?? '',
                $mapped['zip'] ?? '',
                $mapped['country'] ?? ''
            );
        }
    }

    /**
     * @param  array<string, mixed>  $contact
     * @param  array<string, string>  $mapping
     */
    private function extractName(array $contact, array $mapping): string
    {
        $mapped = $this->applyMapping($contact, $mapping);
        $parts = array_filter([
            $mapped['first_name'] ?? '',
            $mapped['last_name'] ?? '',
        ]);

        if (empty($parts) && ! empty($mapped['full_name'])) {
            return $mapped['full_name'];
        }

        return implode(' ', $parts);
    }

    private function sanitizeFilename(string $name): string
    {
        $sanitized = preg_replace('/[^a-zA-Z0-9\-_\s]/', '', $name);
        $sanitized = preg_replace('/\s+/', '-', trim($sanitized));

        return strtolower($sanitized) ?: 'contact';
    }
}
