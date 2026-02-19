<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\MappingTemplateController;
use App\Http\Controllers\ShareController;
use App\Http\Controllers\WizardController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

Route::post('/wizard/upload', [WizardController::class, 'upload'])->name('wizard.upload');
Route::post('/wizard/ai-mapping', [WizardController::class, 'aiMapping'])->name('wizard.ai-mapping');
Route::post('/wizard/apply-mapping', [WizardController::class, 'applyMapping'])->name('wizard.apply-mapping');
Route::post('/wizard/generate', [WizardController::class, 'generate'])->name('wizard.generate');
Route::get('/wizard/status', [WizardController::class, 'status'])->name('wizard.status');
Route::get('/wizard/download/{exportUlid}', [WizardController::class, 'download'])->name('wizard.download');
Route::get('/download/{token}', [WizardController::class, 'publicDownload'])->name('public.download');

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
});

require __DIR__.'/settings.php';
