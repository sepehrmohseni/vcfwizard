<?php

namespace App\Services;

class DuplicateDetector
{
    /**
     * @param  array<int, array<string, mixed>>  $contacts
     * @return array{duplicates: array<int, int>, groups: array<array<int>>}
     */
    public function detect(array $contacts): array
    {
        $emailIndex = [];
        $phoneIndex = [];
        $duplicateMap = [];
        $groups = [];

        foreach ($contacts as $index => $contact) {
            $emails = $this->extractEmails($contact);
            $phones = $this->extractPhones($contact);

            foreach ($emails as $email) {
                $normalized = strtolower(trim($email));
                if (empty($normalized)) {
                    continue;
                }
                if (isset($emailIndex[$normalized])) {
                    $duplicateMap[$index] = $emailIndex[$normalized];
                } else {
                    $emailIndex[$normalized] = $index;
                }
            }

            if (isset($duplicateMap[$index])) {
                continue;
            }

            foreach ($phones as $phone) {
                $normalized = preg_replace('/[^\d]/', '', $phone);
                if (empty($normalized) || strlen($normalized) < 7) {
                    continue;
                }
                $key = substr($normalized, -10);
                if (isset($phoneIndex[$key])) {
                    $duplicateMap[$index] = $phoneIndex[$key];
                } else {
                    $phoneIndex[$key] = $index;
                }
            }
        }

        $groupMap = [];
        foreach ($duplicateMap as $dup => $original) {
            $root = $original;
            while (isset($duplicateMap[$root])) {
                $root = $duplicateMap[$root];
            }
            $groupMap[$root][] = $dup;
        }

        foreach ($groupMap as $root => $members) {
            $groups[] = array_merge([$root], $members);
        }

        return [
            'duplicates' => $duplicateMap,
            'groups' => $groups,
        ];
    }

    /**
     * @param  array<string, mixed>  $contact
     * @return array<string>
     */
    private function extractEmails(array $contact): array
    {
        $emails = [];
        $emailKeys = ['email', 'email_work', 'email_home', 'e-mail', 'Email', 'E-mail'];
        foreach ($emailKeys as $key) {
            if (isset($contact[$key]) && is_string($contact[$key]) && str_contains($contact[$key], '@')) {
                $emails[] = $contact[$key];
            }
        }

        return $emails;
    }

    /**
     * @param  array<string, mixed>  $contact
     * @return array<string>
     */
    private function extractPhones(array $contact): array
    {
        $phones = [];
        $phoneKeys = ['phone', 'phone_mobile', 'phone_home', 'phone_work', 'Phone', 'Mobile', 'Cell'];
        foreach ($phoneKeys as $key) {
            if (isset($contact[$key]) && is_string($contact[$key]) && strlen(preg_replace('/[^\d]/', '', $contact[$key])) >= 7) {
                $phones[] = $contact[$key];
            }
        }

        return $phones;
    }
}
