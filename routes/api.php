<?php

use App\Http\Controllers\Api\ZapierController;
use App\Http\Middleware\AuthenticateApiKey;
use Illuminate\Support\Facades\Route;

Route::middleware(AuthenticateApiKey::class)->group(function () {
    Route::get('/me', [ZapierController::class, 'me']);

    Route::get('/triggers/import-completed', [ZapierController::class, 'triggerImportCompleted']);
    Route::get('/triggers/import-failed', [ZapierController::class, 'triggerImportFailed']);

    Route::post('/hooks', [ZapierController::class, 'subscribe']);
    Route::delete('/hooks/{webhook}', [ZapierController::class, 'unsubscribe']);

    Route::post('/actions/convert', [ZapierController::class, 'convert']);

    Route::get('/imports', [ZapierController::class, 'listImports']);
});
