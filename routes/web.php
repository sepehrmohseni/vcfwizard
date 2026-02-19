<?php

use App\Http\Controllers\ApiKeyController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\MappingTemplateController;
use App\Http\Controllers\PricingController;
use App\Http\Controllers\ShareController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\WizardController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');
Route::get('/pricing', PricingController::class)->name('pricing');

Route::post('/wizard/upload', [WizardController::class, 'upload'])->name('wizard.upload');
Route::post('/wizard/apply-mapping', [WizardController::class, 'applyMapping'])->name('wizard.apply-mapping');
Route::post('/wizard/generate', [WizardController::class, 'generate'])->name('wizard.generate');
Route::get('/wizard/resume', [WizardController::class, 'resume'])->name('wizard.resume');
Route::get('/wizard/status', [WizardController::class, 'status'])->name('wizard.status');
Route::get('/wizard/download/{exportUlid}', [WizardController::class, 'download'])->name('wizard.download');
Route::get('/download/{token}', [WizardController::class, 'publicDownload'])->name('public.download');

Route::middleware(['auth'])->group(function () {
    Route::post('/wizard/ai-mapping', [WizardController::class, 'aiMapping'])->name('wizard.ai-mapping');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/import', ImportController::class)->name('import');
    Route::get('/history', [HistoryController::class, 'index'])->name('history');
    Route::get('/history/{import}/preview', [HistoryController::class, 'preview'])->name('history.preview');
    Route::get('/templates', [MappingTemplateController::class, 'index'])->name('templates');
    Route::post('/templates', [MappingTemplateController::class, 'store'])->name('templates.store');
    Route::delete('/templates/{mappingTemplate}', [MappingTemplateController::class, 'destroy'])->name('templates.destroy');
    Route::get('/api/templates', [MappingTemplateController::class, 'userTemplates'])->name('api.templates');
    Route::post('/share', [ShareController::class, 'createShareLink'])->name('share.create');

    Route::get('/billing', [BillingController::class, 'index'])->name('billing.index');
    Route::post('/billing/subscribe', [BillingController::class, 'subscribe'])->name('billing.subscribe');
    Route::post('/billing/cancel', [BillingController::class, 'cancel'])->name('billing.cancel');
    Route::post('/billing/resume', [BillingController::class, 'resume'])->name('billing.resume');
    Route::get('/billing/invoices', [BillingController::class, 'invoices'])->name('billing.invoices');
    Route::get('/billing/invoices/{invoiceId}', [BillingController::class, 'downloadInvoice'])->name('billing.invoice.download');
});

Route::middleware(['auth', 'verified', 'subscribed'])->group(function () {
    Route::get('/integrations', [IntegrationController::class, 'index'])->name('integrations.index');
    Route::get('/integrations/google-sheets/connect', [IntegrationController::class, 'connectGoogleSheets'])->name('integrations.google-sheets.connect');
    Route::get('/integrations/google-sheets/callback', [IntegrationController::class, 'googleSheetsCallback'])->name('integrations.google-sheets.callback');
    Route::get('/integrations/{integration}/sheets', [IntegrationController::class, 'listSheets'])->name('integrations.sheets');
    Route::post('/integrations/{integration}/read', [IntegrationController::class, 'readSheet'])->name('integrations.read');
    Route::delete('/integrations/{integration}', [IntegrationController::class, 'disconnect'])->name('integrations.disconnect');

    Route::get('/webhooks', [WebhookController::class, 'index'])->name('webhooks.index');
    Route::post('/webhooks', [WebhookController::class, 'store'])->name('webhooks.store');
    Route::patch('/webhooks/{webhook}', [WebhookController::class, 'update'])->name('webhooks.update');
    Route::delete('/webhooks/{webhook}', [WebhookController::class, 'destroy'])->name('webhooks.destroy');
    Route::get('/webhooks/{webhook}/deliveries', [WebhookController::class, 'deliveries'])->name('webhooks.deliveries');
    Route::post('/webhooks/{webhook}/regenerate-secret', [WebhookController::class, 'regenerateSecret'])->name('webhooks.regenerate-secret');

    Route::get('/api-keys', [ApiKeyController::class, 'index'])->name('api-keys.index');
    Route::post('/api-keys', [ApiKeyController::class, 'store'])->name('api-keys.store');
    Route::delete('/api-keys/{apiKey}', [ApiKeyController::class, 'destroy'])->name('api-keys.destroy');
});

require __DIR__.'/settings.php';
