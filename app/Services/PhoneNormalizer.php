<?php

namespace App\Services;

class PhoneNormalizer
{
    public function normalize(string $phone, string $defaultCountryCode = '+1'): string
    {
        $cleaned = preg_replace('/[^\d+]/', '', $phone);

        if (empty($cleaned)) {
            return $phone;
        }

        if (str_starts_with($cleaned, '+')) {
            return $cleaned;
        }

        if (str_starts_with($cleaned, '00')) {
            return '+'.substr($cleaned, 2);
        }

        $digits = ltrim($cleaned, '0');

        if (strlen($digits) === 10 && $defaultCountryCode === '+1') {
            return '+1'.$digits;
        }

        if (strlen($digits) === 11 && str_starts_with($digits, '1')) {
            return '+'.$digits;
        }

        if (strlen($digits) >= 10 && strlen($digits) <= 15) {
            return $defaultCountryCode.$digits;
        }

        return $phone;
    }

    /**
     * @param  array<string>  $phones
     * @return array<string>
     */
    public function normalizeAll(array $phones, string $defaultCountryCode = '+1'): array
    {
        return array_map(
            fn (string $phone) => $this->normalize($phone, $defaultCountryCode),
            $phones
        );
    }
}
